import { createServerClient, type TelemetryEvent } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// POST /api/events - Ingest telemetry events from SDK
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { client_id, sdk_version, event_type, success } = body;
    
    if (!client_id || !sdk_version || !event_type || success === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: client_id, sdk_version, event_type, success" },
        { status: 400 }
      );
    }

    const event: TelemetryEvent = {
      client_id,
      sdk_version,
      event_type,
      success: Boolean(success),
      error_type: body.error_type,
      chain_id: body.chain_id,
      metadata: body.metadata,
    };

    const supabase = createServerClient();
    
    if (!supabase) {
      console.log("Telemetry event (no DB):", event);
      return NextResponse.json({ success: true, id: "demo" }, { status: 201 });
    }
    
    const { data, error } = await supabase
      .from("telemetry_events")
      .insert(event)
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Failed to store event" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data.id }, { status: 201 });
  } catch (error) {
    console.error("Event ingestion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/events - Fetch recent events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    const supabase = createServerClient();
    
    if (!supabase) {
      return NextResponse.json([]);
    }
    
    const { data, error } = await supabase
      .from("telemetry_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Supabase query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch events" },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Event fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
