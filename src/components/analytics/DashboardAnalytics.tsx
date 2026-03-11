"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertTriangle, TrendingUp, BarChart3, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/constants";
import type { Todo, TodoStatus, TodoPriority, TodoCategory } from "@/types";

interface DashboardAnalyticsProps {
  todos: Todo[];
}

export function DashboardAnalytics({ todos }: DashboardAnalyticsProps) {
  const stats = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const completed = todos.filter((t) => t.status === "COMPLETED").length;
    const inProgress = todos.filter((t) => t.status === "IN_PROGRESS").length;
    const pending = todos.filter((t) => t.status === "PENDING").length;
    const overdue = todos.filter(
      (t) => t.dueDate && t.status !== "COMPLETED" && new Date(t.dueDate) < now
    ).length;

    // Due today
    const todayStr = now.toISOString().split("T")[0];
    const dueToday = todos.filter(
      (t) => t.dueDate && t.status !== "COMPLETED" && t.dueDate.startsWith(todayStr)
    ).length;

    // Completion rate
    const completionRate = todos.length > 0 ? Math.round((completed / todos.length) * 100) : 0;

    // By category
    const byCategory = CATEGORIES.map((cat) => ({
      ...cat,
      count: todos.filter((t) => t.category === cat.value).length,
    })).filter((c) => c.count > 0).sort((a, b) => b.count - a.count);

    // By priority
    const byPriority: { label: string; value: TodoPriority; count: number; color: string }[] = [
      { label: "High", value: "HIGH", count: todos.filter((t) => t.priority === "HIGH").length, color: "bg-red-500" },
      { label: "Medium", value: "MEDIUM", count: todos.filter((t) => t.priority === "MEDIUM").length, color: "bg-yellow-500" },
      { label: "Low", value: "LOW", count: todos.filter((t) => t.priority === "LOW").length, color: "bg-green-500" },
    ];

    // Weekly completed (last 7 days)
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const completedThisWeek = todos.filter(
      (t) => t.status === "COMPLETED" && new Date(t.updatedAt) >= weekAgo
    ).length;

    return {
      total: todos.length,
      completed,
      inProgress,
      pending,
      overdue,
      dueToday,
      completionRate,
      byCategory,
      byPriority,
      completedThisWeek,
    };
  }, [todos]);

  const maxCategoryCount = Math.max(...stats.byCategory.map((c) => c.count), 1);

  return (
    <div className="space-y-4">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Target className="h-4 w-4" />}
          label="Total Tasks"
          value={stats.total}
          color="text-blue-500"
          bgColor="bg-blue-500/10"
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Completed"
          value={stats.completed}
          color="text-green-500"
          bgColor="bg-green-500/10"
          sub={`${stats.completionRate}%`}
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="In Progress"
          value={stats.inProgress}
          color="text-yellow-500"
          bgColor="bg-yellow-500/10"
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Overdue"
          value={stats.overdue}
          color="text-red-500"
          bgColor="bg-red-500/10"
          highlight={stats.overdue > 0}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Distribution */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">By Category</h3>
            </div>
            {stats.byCategory.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No tasks yet</p>
            ) : (
              <div className="space-y-2">
                {stats.byCategory.map((cat) => (
                  <div key={cat.value} className="flex items-center gap-2">
                    <span className="text-xs w-20 truncate">{cat.emoji} {cat.label}</span>
                    <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/70 rounded-full transition-all duration-500"
                        style={{ width: `${(cat.count / maxCategoryCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-6 text-right">{cat.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Priority + Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Overview</h3>
            </div>

            {/* Priority breakdown */}
            <p className="text-xs text-muted-foreground mb-2">Priority</p>
            <div className="flex gap-1 h-4 rounded-full overflow-hidden mb-4">
              {stats.byPriority.map((p) =>
                p.count > 0 ? (
                  <div
                    key={p.value}
                    className={cn("transition-all duration-500", p.color)}
                    style={{ width: `${(p.count / stats.total) * 100}%` }}
                    title={`${p.label}: ${p.count}`}
                  />
                ) : null
              )}
              {stats.total === 0 && <div className="w-full bg-muted" />}
            </div>
            <div className="flex gap-3 mb-4">
              {stats.byPriority.map((p) => (
                <div key={p.value} className="flex items-center gap-1.5">
                  <div className={cn("h-2.5 w-2.5 rounded-full", p.color)} />
                  <span className="text-xs text-muted-foreground">{p.label} ({p.count})</span>
                </div>
              ))}
            </div>

            {/* Status breakdown */}
            <p className="text-xs text-muted-foreground mb-2">Status</p>
            <div className="flex gap-1 h-4 rounded-full overflow-hidden mb-3">
              {stats.pending > 0 && (
                <div
                  className="bg-gray-400 transition-all duration-500"
                  style={{ width: `${(stats.pending / stats.total) * 100}%` }}
                  title={`Pending: ${stats.pending}`}
                />
              )}
              {stats.inProgress > 0 && (
                <div
                  className="bg-yellow-500 transition-all duration-500"
                  style={{ width: `${(stats.inProgress / stats.total) * 100}%` }}
                  title={`In Progress: ${stats.inProgress}`}
                />
              )}
              {stats.completed > 0 && (
                <div
                  className="bg-green-500 transition-all duration-500"
                  style={{ width: `${(stats.completed / stats.total) * 100}%` }}
                  title={`Completed: ${stats.completed}`}
                />
              )}
              {stats.total === 0 && <div className="w-full bg-muted" />}
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-gray-400" />
                <span className="text-xs text-muted-foreground">Pending ({stats.pending})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                <span className="text-xs text-muted-foreground">In Progress ({stats.inProgress})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span className="text-xs text-muted-foreground">Done ({stats.completed})</span>
              </div>
            </div>

            {/* Weekly stats */}
            {stats.completedThisWeek > 0 && (
              <div className="mt-4 pt-3 border-t">
                <p className="text-xs text-muted-foreground">
                  Completed this week: <span className="font-semibold text-foreground">{stats.completedThisWeek} tasks</span>
                </p>
              </div>
            )}

            {stats.dueToday > 0 && (
              <div className="mt-2">
                <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                  {stats.dueToday} task{stats.dueToday > 1 ? "s" : ""} due today
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  bgColor,
  sub,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bgColor: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <Card className={cn(highlight && "border-red-500/50")}>
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-lg", bgColor, color)}>{icon}</div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <div className="flex items-baseline gap-1">
              <p className="text-xl font-bold">{value}</p>
              {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
