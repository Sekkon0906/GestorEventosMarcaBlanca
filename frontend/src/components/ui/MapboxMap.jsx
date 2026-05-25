import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapboxMap({ query, className = 'w-full h-full', zoom = 15 }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markerRef    = useRef(null);
  const abortRef     = useRef(null);

  useEffect(() => {
    if (!TOKEN || !containerRef.current) return;
    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-74.0721, 4.7110],
      zoom: 10,
      attributionControl: false,
    });
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current    = map;
    markerRef.current = new mapboxgl.Marker({ color: '#818cf8' }).addTo(map);
    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
  }, []);

  useEffect(() => {
    if (!query || !TOKEN) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const wait = !mapRef.current;
    const run = () => {
      fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${TOKEN}&limit=1`,
        { signal: ctrl.signal }
      )
        .then(r => r.json())
        .then(d => {
          const f = d.features?.[0];
          if (!f || !mapRef.current) return;
          const [lng, lat] = f.center;
          mapRef.current.flyTo({ center: [lng, lat], zoom, duration: 1000, essential: true });
          markerRef.current?.setLngLat([lng, lat]);
        })
        .catch(() => {});
    };
    if (wait) {
      const t = setTimeout(run, 300);
      return () => clearTimeout(t);
    }
    run();
  }, [query, zoom]);

  return <div ref={containerRef} className={className} />;
}
