import { createServerClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// GET /api/stats - Fetch aggregated statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const supabase = createServerClient();
    
    if (!supabase) {
      return NextResponse.json({
        totalEvents: 0,
        uniqueClients: 0,
        successRate: 0,
        actionBreakdown: [],
        versionDistribution: [],
        dailyUsage: [],
        errorBreakdown: [],
      });
    }
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Total events
    const { count: totalEvents } = await supabase
      .from("telemetry_events")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startDate.toISOString());

    // Unique clients
    const { data: uniqueClientsData } = await supabase
      .from("telemetry_events")
      .select("client_id")
      .gte("created_at", startDate.toISOString());
    
    const uniqueClients = new Set(uniqueClientsData?.map(e => e.client_id)).size;

    // Success rate
    const { count: successCount } = await supabase
      .from("telemetry_events")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startDate.toISOString())
      .eq("success", true);

    const successRate = totalEvents ? (successCount || 0) / totalEvents : 0;

    // Events by type
    const { data: eventsByTypeData } = await supabase
      .from("telemetry_events")
      .select("event_type")
      .gte("created_at", startDate.toISOString());

    const eventsByType: Record<string, number> = {};
    eventsByTypeData?.forEach(e => {
      eventsByType[e.event_type] = (eventsByType[e.event_type] || 0) + 1;
    });

    // Success rate by type
    const actionBreakdown = await Promise.all(
      Object.keys(eventsByType).map(async (action) => {
        const { count: actionSuccess } = await supabase
          .from("telemetry_events")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startDate.toISOString())
          .eq("event_type", action)
          .eq("success", true);

        return {
          action,
          count: eventsByType[action],
          success_rate: eventsByType[action] ? (actionSuccess || 0) / eventsByType[action] : 0,
        };
      })
    );

    // Version distribution
    const { data: versionData } = await supabase
      .from("telemetry_events")
      .select("sdk_version")
      .gte("created_at", startDate.toISOString());

    const versionCounts: Record<string, number> = {};
    versionData?.forEach(e => {
      versionCounts[e.sdk_version] = (versionCounts[e.sdk_version] || 0) + 1;
    });

    const versionDistribution = Object.entries(versionCounts).map(([version, count]) => ({
      version,
      count,
    }));

    // Daily usage (last 7 days for performance)
    const dailyDays = Math.min(days, 7);
    const dailyUsage: Array<{ date: string; events: number; unique_clients: number }> = [];
    
    for (let i = dailyDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const { data: dayEvents } = await supabase
        .from("telemetry_events")
        .select("client_id")
        .gte("created_at", date.toISOString())
        .lt("created_at", nextDate.toISOString());

      dailyUsage.push({
        date: dateStr,
        events: dayEvents?.length || 0,
        unique_clients: new Set(dayEvents?.map(e => e.client_id)).size,
      });
    }

    return NextResponse.json({
      totalEvents: totalEvents || 0,
      uniqueClients,
      successRate,
      actionBreakdown,
      versionDistribution,
      dailyUsage,
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
