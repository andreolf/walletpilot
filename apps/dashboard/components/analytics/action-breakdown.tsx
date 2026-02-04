"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ActionBreakdownProps {
  data: Array<{
    action: string;
    count: number;
    success_rate: number;
  }>;
}

const COLORS: Record<string, string> = {
  sdk_init: "#8b5cf6",
  connect: "#3b82f6",
  swap: "#10b981",
  send: "#f59e0b",
  sign: "#ec4899",
  error: "#ef4444",
  request_permission: "#06b6d4",
  execute: "#84cc16",
};

export function ActionBreakdown({ data }: ActionBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Actions Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              type="number"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              dataKey="action"
              type="category"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value, name, props) => {
                const successRate = props?.payload?.success_rate ?? 0;
                return [`${value} (${(successRate * 100).toFixed(0)}% success)`, "Count"];
              }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.action] || "#6b7280"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
