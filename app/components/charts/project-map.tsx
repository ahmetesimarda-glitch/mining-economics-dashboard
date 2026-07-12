'use client';

import { useEffect, useRef, useState } from 'react';

interface ProjectMapProps {
  latitude: number;
  longitude: number;
  name: string;
}

export function ProjectMap({ latitude, longitude, name }: ProjectMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
    // Inject leaflet CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    if (!mounted || !mapRef.current || mapInstance.current) return;
    if (latitude === 0 && longitude === 0) return;

    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default;

        const map = L.map(mapRef.current!, {
          center: [latitude, longitude],
          zoom: 10,
          scrollWheelZoom: false,
        });

        L.tileLayer('https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Tiled_web_map_numbering.png/330px-Tiled_web_map_numbering.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 18,
        }).addTo(map);

        const icon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="background:#10b981;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        L.marker([latitude, longitude], { icon }).addTo(map)
          .bindPopup(`<b>${name}</b><br/>Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`);

        mapInstance.current = map;

        setTimeout(() => map.invalidateSize(), 100);
      } catch (err) {
        console.error('Map init error:', err);
      }
    };

    initMap();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [mounted, latitude, longitude, name]);

  if (latitude === 0 && longitude === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] rounded-lg bg-muted/30 border border-border/30">
        <p className="text-sm text-muted-foreground">Konum bilgisi girilmedi. Proje düzenleme sayfasından enlem/boylam giriniz.</p>
      </div>
    );
  }

  return <div ref={mapRef} className="h-[350px] rounded-lg overflow-hidden border border-border/30" />;
}
