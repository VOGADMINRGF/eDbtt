//features/map/OLMap.tsx
"use client";

import { useEffect, useRef } from "react";
import Map from "ol/Map";
import View from "ol/View";
import { fromLonLat, transformExtent } from "ol/proj";
import { apply as applyMapboxStyle } from "ol-mapbox-style";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Style, Circle as CircleStyle, Fill, Stroke } from "ol/style";
import Attribution from "ol/control/Attribution";
import ScaleLine from "ol/control/ScaleLine";

type PointsResponse = {
  ok: boolean;
  points?: Array<{
    _id?: string;
    title?: string;
    tags?: string[];
    location?: { type: "Point"; coordinates: [number, number] }; // [lon, lat]
  }>;
  count?: number;
  error?: string;
};

const POINT_STYLE = new Style({
  image: new CircleStyle({
    radius: 5,
    fill: new Fill({ color: "rgba(59,130,246,0.9)" }),
    stroke: new Stroke({ color: "white", width: 1 }),
  }),
});

export default function OLMap() {
  const divRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const vectorRef = useRef<VectorSource | null>(null);

  useEffect(() => {
    const styleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL;
    if (!styleUrl) throw new Error("NEXT_PUBLIC_MAP_STYLE_URL fehlt (keine Demo-URL verwenden).");

    // Vector-Layer für unsere Punkte (aus /api/map/points)
    const vector = new VectorSource();
    vectorRef.current = vector;

    const vectorLayer = new VectorLayer({
      source: vector,
      style: POINT_STYLE,
      properties: { id: "overlay:points" },
      zIndex: 1000,
    });

    const map = new Map({
      target: divRef.current as HTMLDivElement,
      controls: [new Attribution({ collapsible: true }), new ScaleLine()],
      view: new View({
        center: fromLonLat([10.0, 51.0]), // Mitte DE
        zoom: 5,
        minZoom: 2,
        maxZoom: 18,
      }),
      layers: [vectorLayer], // Base-Style wird per apply() hinzugefügt
    });
    mapRef.current = map;

    // Base-Style (Mapbox-Style JSON) auf die Karte anwenden
    applyMapboxStyle(map, styleUrl).catch((e) => {
      console.error("Style apply failed:", e);
    });

    // Loader: lädt Punkte für aktuelle BBOX
    const loadPoints = async () => {
      if (!mapRef.current || !vectorRef.current) return;
      const view = mapRef.current.getView();
      const extent3857 = view.calculateExtent(mapRef.current.getSize() || [0, 0]);
      const [w, s, e, n] = transformExtent(extent3857, "EPSG:3857", "EPSG:4326"); // lon/lat

      try {
        const r = await fetch(`/api/map/points?bbox=${w},${s},${e},${n}&limit=1000`, { cache: "no-store" });
        const j: PointsResponse = await r.json();

        // In FeatureCollection transformieren
        const fc = {
          type: "FeatureCollection",
          features: (j.points || [])
            .filter((p) => p.location?.type === "Point" && Array.isArray(p.location.coordinates))
            .map((p) => ({
              type: "Feature",
              id: p._id || undefined,
              properties: { title: p.title || "", tags: p.tags || [] },
              geometry: { type: "Point", coordinates: p.location!.coordinates },
            })),
        };

        const fmt = new GeoJSON();
        const feats = fmt.readFeatures(fc as any, {
          dataProjection: "EPSG:4326",
          featureProjection: "EPSG:3857",
        });

        vectorRef.current.clear(true);
        vectorRef.current.addFeatures(feats);
      } catch (e) {
        console.error("points fetch failed:", e);
      }
    };

    // initial + bei MoveEnd nachladen (debounced)
    let t: any = null;
    const onMove = () => {
      clearTimeout(t);
      t = setTimeout(loadPoints, 200);
    };
    map.on("moveend", onMove);
    loadPoints();

    return () => {
      map.un("moveend", onMove);
      map.setTarget(undefined);
      mapRef.current = null;
      vectorRef.current = null;
    };
  }, []);

  return (
    <div
      ref={divRef}
      style={{
        width: "100%",
        height: "calc(100vh - 120px)",
        borderRadius: 12,
        overflow: "hidden",
        background: "#0b1220",
      }}
    />
  );
}
