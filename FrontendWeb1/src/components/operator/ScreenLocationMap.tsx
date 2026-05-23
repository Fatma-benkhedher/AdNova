import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function useFixLeafletDefaultIcon() {
  useEffect(() => {
    const proto = L.Icon.Default.prototype as unknown as {
      _getIconUrl?: string;
    };
    delete proto._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    });
  }, []);
}

function MapViewSync({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], Math.max(map.getZoom(), 14), { animate: true });
  }, [lat, lng, map]);
  return null;
}

type Props = {
  lat: number;
  lng: number;
  onMarkerDragEnd: (lat: number, lng: number) => void;
};

/**
 * Interactive OSM map: pan, zoom, draggable marker.
 */
export default function ScreenLocationMap({
  lat,
  lng,
  onMarkerDragEnd,
}: Props) {
  useFixLeafletDefaultIcon();

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      className="z-0 h-64 w-full rounded-b-2xl"
      scrollWheelZoom
      doubleClickZoom
      dragging
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapViewSync lat={lat} lng={lng} />
      <Marker
        position={[lat, lng]}
        draggable
        eventHandlers={{
          dragend: (e) => {
            const m = e.target as L.Marker;
            const p = m.getLatLng();
            onMarkerDragEnd(p.lat, p.lng);
          },
        }}
      />
    </MapContainer>
  );
}
