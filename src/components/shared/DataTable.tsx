import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; onClick: () => void };
  onRowClick?: (row: T) => void;
  keyExtractor: (row: T) => string;
  className?: string;
};

export function DataTable<T>({
  columns,
  data,
  loading,
  error,
  onRetry,
  emptyTitle = "No results",
  emptyDescription,
  emptyAction,
  onRowClick,
  keyExtractor,
  className,
}: DataTableProps<T>) {
  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  return (
    <div className={cn("rounded-md border", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-left font-medium text-muted-foreground",
                    col.headerClassName,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <Skeleton className="h-4 w-full max-w-[120px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                  />
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={keyExtractor(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "border-b transition-colors last:border-0",
                    onRowClick && "cursor-pointer hover:bg-muted/50",
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-4 py-3", col.className)}>
                      {col.cell(row, index)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
