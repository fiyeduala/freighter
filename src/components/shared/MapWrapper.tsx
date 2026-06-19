import { Map } from "lucide-react";
import { useMapbox, type MapOptions } from "@/lib/maps";
import { cn } from "@/lib/utils";

type MapWrapperProps = MapOptions & {
  className?: string;
};

/** Provider-agnostic map wrapper. Swap the hook to change map providers. */
export function MapWrapper({ className, ...options }: MapWrapperProps) {
  const containerRef = useMapbox(options);
  const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

  if (!token) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border bg-muted text-muted-foreground",
          className,
        )}
      >
        <Map className="h-8 w-8" />
        <p className="text-sm">Set VITE_MAPBOX_TOKEN to enable maps</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("map-container", className)}
    />
  );
}
