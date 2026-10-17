"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Map as LeafletMap, LayerGroup, TileLayer } from "leaflet";
import { type Basemap, type MapLegend, type MapPoint, styleMapPins, toMapOptions, toMapPoints } from "./visuals";

const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const TILES: Record<Basemap, { url: string; attribution: string; maxZoom: number }> = {
  streets: { url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: OSM_ATTRIBUTION, maxZoom: 19 },
  light: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: `${OSM_ATTRIBUTION} &copy; <a href="https://carto.com/attributions">CARTO</a>`,
    maxZoom: 19,
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: `${OSM_ATTRIBUTION} &copy; <a href="https://carto.com/attributions">CARTO</a>`,
    maxZoom: 19,
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    maxZoom: 18,
  },
  topo: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: `${OSM_ATTRIBUTION} &copy; <a href="https://opentopomap.org">OpenTopoMap</a>`,
    maxZoom: 17,
  },
};

function popupContent(point: MapPoint): HTMLElement {
  // Built from DOM nodes with textContent, so model-written labels can't inject markup.
  const root = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = point.label;
  root.append(title);
  for (const line of [point.group, point.detail, point.value === undefined ? undefined : String(point.value)]) {
    if (!line) continue;
    root.append(document.createElement("br"), document.createTextNode(line));
  }
  return root;
}

function Legend({ legend }: { legend: MapLegend }) {
  return (
    <div className="copilot-map-legend" aria-label="Map legend">
      {legend.title && <strong>{legend.title}</strong>}
      {legend.items?.map((item) => (
        <span key={item.label}>
          <i style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
      {legend.ramp && (
        <span>
          {legend.ramp.min}
          <i className="copilot-map-ramp" style={{ background: `linear-gradient(to right, ${legend.ramp.colors.join(", ")})` }} />
          {legend.ramp.max}
        </span>
      )}
    </div>
  );
}

type Live = { map: LeafletMap; layer: LayerGroup; L: typeof import("leaflet"); tiles?: TileLayer; basemap?: string };

/** Leaflet map with one pin per point, fitted to the points; the model may style pins, the basemap and a legend. */
export function GeoMapView({ points: raw, options: rawOptions }: { points?: unknown; options?: unknown }) {
  const points = useMemo(() => toMapPoints(raw), [raw]);
  const options = useMemo(() => toMapOptions(rawOptions), [rawOptions]);
  const styled = useMemo(() => styleMapPins(points, options), [points, options]);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Live | null>(null);

  // Leaflet touches `window` on import, so it loads in the browser only.
  useEffect(() => {
    let cancelled = false;
    let created: LeafletMap | null = null;
    void import("leaflet").then((L) => {
      if (cancelled || !containerRef.current) return;
      created = L.map(containerRef.current, { scrollWheelZoom: false });
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

  const syncRef = useRef((_: Live) => {});
  syncRef.current = (live) => {
    const { map, layer, L } = live;
    const basemap = options.basemap ?? "streets";
    if (live.basemap !== basemap) {
      live.tiles?.remove();
      const tiles = TILES[basemap];
      // CORS tiles, so a PDF snapshot of the answer can include the map.
      live.tiles = L.tileLayer(tiles.url, { maxZoom: tiles.maxZoom, attribution: tiles.attribution, crossOrigin: true }).addTo(map);
      live.basemap = basemap;
    }
    layer.clearLayers();
    if (options.connect && points.length > 1) {
      L.polyline(points.map((p): [number, number] => [p.lat, p.lon]), { weight: 2, opacity: 0.7, dashArray: "6 4", className: "copilot-route" }).addTo(layer);
    }
    points.forEach((p, i) => {
      const { color, radius } = styled.pins[i]!;
      const marker = L.circleMarker([p.lat, p.lon], {
        radius,
        weight: 2,
        fillOpacity: 0.85,
        // A pin without a colour takes the theme's from CSS; a coloured one sets its own fill.
        ...(color ? { color: "#1d2420", fillColor: color, className: "copilot-pin-styled" } : { className: "copilot-pin" }),
      }).bindPopup(popupContent(p));
      if (options.showLabels) marker.bindTooltip(p.label, { permanent: true, direction: "top", offset: [0, -radius], className: "copilot-pin-label" });
      marker.addTo(layer);
    });
    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lon])), { padding: [32, 32], maxZoom: 14 });
    }
  };

  useEffect(() => {
    if (mapRef.current) syncRef.current(mapRef.current);
  }, [points, options, styled]);

  return (
    <div className="copilot-map-wrap">
      <div
        ref={containerRef}
        role="region"
        aria-label="Map"
        // The default street map follows the dark theme by inverting; a chosen basemap is shown as is.
        className={`copilot-map${options.basemap ? " copilot-map-chosen" : ""}`}
        style={{ height: 320, width: "100%", overflow: "hidden" }}
      />
      {styled.legend && <Legend legend={styled.legend} />}
    </div>
  );
}
