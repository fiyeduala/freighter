import { Search, SlidersHorizontal, X } from "lucide-react";
import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FilterBarProps = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  activeFilters?: number;
  onClearFilters?: () => void;
  className?: string;
};

export function FilterBar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search…",
  filters,
  activeFilters = 0,
  onClearFilters,
  className,
}: FilterBarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {onSearchChange && (
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
      {filters && (
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          {filters}
        </div>
      )}
      {activeFilters > 0 && onClearFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="h-8 text-muted-foreground"
        >
          Clear {activeFilters} filter{activeFilters !== 1 ? "s" : ""}
          <X className="ml-1 h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
