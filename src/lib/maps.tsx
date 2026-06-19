/**
 * Map provider abstraction layer.
 * Swap the underlying map library here without touching consumer components.
 * Currently uses Mapbox GL JS; set VITE_MAPBOX_TOKEN in .env.
 */
import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import mapboxgl from "mapbox-gl";

const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

if (token) {
  mapboxgl.accessToken = token;
}

export type LngLat = { lng: number; lat: number };

export type MapOptions = {
  center?: LngLat;
  zoom?: number;
  style?: string;
};

const DEFAULT_CENTER: LngLat = { lng: 3.3792, lat: 6.5244 }; // Lagos, Nigeria
const DEFAULT_STYLE = "mapbox://styles/mapbox/light-v11";

/** Low-level hook — prefer <MapWrapper> for components */
export function useMapbox(options: MapOptions = {}): RefObject<HTMLDivElement> {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !token) return;

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: options.style ?? DEFAULT_STYLE,
      center: [options.center?.lng ?? DEFAULT_CENTER.lng, options.center?.lat ?? DEFAULT_CENTER.lat],
      zoom: options.zoom ?? 10,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [options.center?.lat, options.center?.lng, options.zoom, options.style]);

  return containerRef;
}

export { mapboxgl };
