'use client';

import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';

interface ProjectMapProps {
  latitude: number;
  longitude: number;
  name: string;
}

/** OpenStreetMap raster tiles (standard community endpoint). */
const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export function ProjectMap({ latitude, longitude, name }: ProjectMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const mapInstance = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    if (!mounted || !mapRef.current) return;
    if (latitude === 0 && longitude === 0) return;

    let cancelled = false;

    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default;
        if (cancelled || !mapRef.current) return;

        const placeMarker = (map: LeafletMap) => {
          if (markerRef.current) {
            markerRef.current.remove();
            markerRef.current = null;
          }
          const icon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background:#10b981;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });
          markerRef.current = L.marker([latitude, longitude], { icon })
            .addTo(map)
            .bindPopup(
              `<b>${name}</b><br/>Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`
            );
        };

        if (mapInstance.current) {
          mapInstance.current.setView([latitude, longitude], 10);
          placeMarker(mapInstance.current);
          setTimeout(() => mapInstance.current?.invalidateSize(), 100);
          return;
        }

        const map = L.map(mapRef.current, {
          center: [latitude, longitude],
          zoom: 10,
          scrollWheelZoom: false,
        });

        L.tileLayer(OSM_TILE_URL, {
          attribution: OSM_ATTRIBUTION,
          maxZoom: 19,
        }).addTo(map);

        placeMarker(map);
        mapInstance.current = map;
        setTimeout(() => map.invalidateSize(), 100);
      } catch (err) {
        console.error('Map init error:', err);
      }
    };

    void initMap();

    return () => {
      cancelled = true;
    };
  }, [mounted, latitude, longitude, name]);

  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  if (latitude === 0 && longitude === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] rounded-lg bg-muted/30 border border-border/30">
        <p className="text-sm text-muted-foreground">
          Konum bilgisi girilmedi. Proje düzenleme sayfasından konum araması veya enlem/boylam
          giriniz.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="h-[350px] rounded-lg overflow-hidden border border-border/30"
    />
  );
}
