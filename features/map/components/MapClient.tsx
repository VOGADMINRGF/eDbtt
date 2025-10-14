//features/map/components/MapClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import maplibregl from "maplibre-gl";

type Pt = {
  _id: string;
  title: string;
  tags?: string[];
  status?: string;
  location: { type: "Point"; coordinates: [number, number] };
};

const STYLE_FALLBACK = "https://demotiles.maplibre.org/style.json";

export default function MapClient() {
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [points, setPoints] = useState<Pt[]>([]);
  const [bbox, setBbox] = useState<[number, number, number, number]>([13.3, 52.45, 13.6, 52.6]); // Berlin Demo

  // Map container
  const containerId = useMemo(() => `map-${Math.random().toString(36).slice(2)}`, []);

  // Load points when bbox changes
  useEffect(() => {
    const q = new URLSearchParams({ bbox: bbox.join(","), limit: "300" });
    fetch(`/api/map/points?${q.toString()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setPoints(j.points || []))
      .catch(() => {});
  }, [bbox]);

  // Init maplibre
  useEffect(() => {
    const el = document.getElementById(containerId);
    if (!el) return;

    const map = new maplibregl.Map({
      container: containerId,
      style: (process.env.NEXT_PUBLIC_MAP_STYLE_URL || process.env.MAP_STYLE_URL || STYLE_FALLBACK) as string,
      center: [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2],
      zoom: 11,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");

    // Track bbox updates
    map.on("moveend", () => {
      const b = map.getBounds();
      setBbox([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    });

    setMap(map);
    return () => map.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId]);

  // Render points as simple markers (no cluster yet)
  useEffect(() => {
    if (!map) return;

    const id = "vog-points";
    const srcId = "vog-points-src";

    if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource(srcId)) map.removeSource(srcId);

    const fc = {
      type: "FeatureCollection",
      features: points.map((p) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: p.location.coordinates },
        properties: { title: p.title, tags: p.tags?.join(",") ?? "", status: p.status ?? "" },
      })),
    } as GeoJSON.FeatureCollection;

    map.addSource(srcId, { type: "geojson", data: fc });

    map.addLayer({
      id,
      type: "circle",
      source: srcId,
      paint: {
        "circle-radius": 4,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#ffffff",
        "circle-color": "#2563eb",
      },
    });

    return () => {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(srcId)) map.removeSource(srcId);
    };
  }, [map, points]);

  return <div id={containerId} style={{ width: "100%", height: "100%" }} />;
}
