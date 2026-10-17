"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import { type MapPoint, toMapPoints } from "./visuals";

function popupContent(point: MapPoint): HTMLElement {
  // Built from DOM nodes with textContent, so model-written labels can't inject markup.
  const root = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = point.label;
  root.append(title);
  for (const line of [point.detail, point.value === undefined ? undefined : String(point.value)]) {
    if (!line) continue;
    root.append(document.createElement("br"), document.createTextNode(line));
  }
  return root;
}

/** Leaflet map with OpenStreetMap tiles, one pin per point, fitted to the points. */
export function GeoMapView({ points: raw }: { points?: unknown }) {
  const points = useMemo(() => toMapPoints(raw), [raw]);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{ map: LeafletMap; layer: LayerGroup; L: typeof import("leaflet") } | null>(
    null,
  );

  // Leaflet touches `window` on import, so it loads in the browser only.
  useEffect(() => {
    let cancelled = false;
    let created: LeafletMap | null = null;
    void import("leaflet").then((L) => {
      if (cancelled || !containerRef.current) return;
      created = L.map(containerRef.current, { scrollWheelZoom: false });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(created);
      mapRef.current = { map: created, layer: L.layerGroup().addTo(created), L };
      created.setView([0, 0], 2);
      syncRef.current(mapRef.current);
    });
    return () => {
      cancelled = true;
      mapRef.current = null;
      created?.remove();
    };
  }, []);

  const syncRef = useRef((_: NonNullable<typeof mapRef.current>) => {});
  syncRef.current = ({ map, layer, L }) => {
    layer.clearLayers();
    for (const p of points) {
      L.circleMarker([p.lat, p.lon], { radius: 8, weight: 2, fillOpacity: 0.85, className: "copilot-pin" })
        .bindPopup(popupContent(p))
        .addTo(layer);
    }
    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lon])), {
        padding: [32, 32],
        maxZoom: 14,
      });
    }
  };

  useEffect(() => {
    if (mapRef.current) syncRef.current(mapRef.current);
  }, [points]);

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Map"
      className="copilot-map"
      style={{ height: 320, width: "100%", overflow: "hidden" }}
    />
  );
}
