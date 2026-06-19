import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: { value: number; label: string };
  loading?: boolean;
  className?: string;
  accent?: "default" | "success" | "warning" | "danger";
};

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  loading = false,
  className,
  accent = "default",
}: StatCardProps) {
  if (loading) {
    return (
      <Card className={cn("p-6", className)}>
        <Skeleton className="mb-3 h-4 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-3 w-20" />
      </Card>
    );
  }

  const accentColors = {
    default: "bg-primary/10 text-primary",
    success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <Card className={cn("p-6", className)}>
      <CardContent className="p-0">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {Icon && (
            <div className={cn("rounded-lg p-2", accentColors[accent])}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
        <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
        {trend && (
          <div
            className={cn(
              "mt-1 flex items-center gap-1 text-xs",
              trend.value >= 0 ? "text-green-600" : "text-red-600",
            )}
          >
            {trend.value >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span>
              {trend.value >= 0 ? "+" : ""}
              {trend.value}% {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
