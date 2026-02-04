"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  XCircle,
  Plug,
  ArrowRightLeft,
  Send,
  PenTool,
  Zap,
  ShieldCheck,
  Play,
} from "lucide-react";

interface RecentEvent {
  id: string;
  created_at: string;
  event_type: string;
  success: boolean;
  client_id: string;
  sdk_version: string;
  error_type?: string;
}

interface RecentEventsProps {
  events: RecentEvent[];
}

const EVENT_ICONS: Record<string, any> = {
  sdk_init: Zap,
  connect: Plug,
  swap: ArrowRightLeft,
  send: Send,
  sign: PenTool,
  error: XCircle,
  request_permission: ShieldCheck,
  execute: Play,
};

export function RecentEvents({ events }: RecentEventsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Events</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No events yet. SDK telemetry will appear here.
            </p>
          ) : (
            events.map((event) => {
              const Icon = EVENT_ICONS[event.event_type] || Zap;
              return (
                <div
                  key={event.id}
                  className="flex items-center gap-4 rounded-lg border border-border p-3"
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full shrink-0",
                      event.success
                        ? "bg-green-500/10 text-green-500"
                        : "bg-red-500/10 text-red-500"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none truncate">
                      {event.event_type}
                      {event.error_type && (
                        <span className="ml-2 text-xs text-red-500">
                          ({event.error_type})
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      v{event.sdk_version} • {event.client_id.slice(0, 8)}...
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {event.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(event.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
