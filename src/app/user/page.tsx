'use client';
import { useState, useCallback } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { trpc } from '@/utils/trpc';
import Link from 'next/link';
import { Spinner } from "@heroui/react";

const mapContainerStyle = {
  width: '100%',
  height: '100vh',
};

const center = {
  lat: -33.8688, // Sydney
  lng: 151.2093,
};

export default function UserPage() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [bounds, setBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<any>(null);

  const { data: spots } = trpc.parking.getParkingSpots.useQuery(
    { bounds: bounds! },
    { enabled: !!bounds }
  );

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onBoundsChanged = () => {
    if (map) {
      const bounds = map.getBounds();
      if (bounds) {
        setBounds({
          north: bounds.getNorthEast().lat(),
          south: bounds.getSouthWest().lat(),
          east: bounds.getNorthEast().lng(),
          west: bounds.getSouthWest().lng(),
        });
      }
    }
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="relative h-screen w-full">
      <div className="absolute top-4 left-4 z-10">
        <Link href="/">
          <div className="bg-white px-4 py-2 rounded shadow font-bold cursor-pointer hover:bg-gray-100">
            ← Back
          </div>
        </Link>
      </div>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={15}
        center={center}
        onLoad={onMapLoad}
        onIdle={onBoundsChanged}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
        }}
      >
        {spots?.map((spot) => (
          <Marker
            key={spot.id}
            position={{ lat: spot.latitude, lng: spot.longitude }}
            onClick={() => setSelectedSpot(spot)}
          />
        ))}

        {selectedSpot && (
          <InfoWindow
            position={{ lat: selectedSpot.latitude, lng: selectedSpot.longitude }}
            onCloseClick={() => setSelectedSpot(null)}
          >
            <div className="max-w-xs">
              <h3 className="font-bold mb-2">Parking Info</h3>
              {selectedSpot.imageUrl && selectedSpot.imageUrl !== "placeholder" && (
                <img src={selectedSpot.imageUrl} alt="Sign" className="w-full h-32 object-cover mb-2 rounded" />
              )}
              <div className="text-sm">
                <p><strong>Summary:</strong> {selectedSpot.parsedData?.summary || "No summary"}</p>
                {selectedSpot.parsedData?.restrictions?.length > 0 && (
                   <div className="mt-2">
                     <strong>Restrictions:</strong>
                     <ul className="list-disc pl-4">
                       {selectedSpot.parsedData.restrictions.map((r: any, i: number) => (
                         <li key={i}>
                           {r.limit} {r.type} ({r.start_time}-{r.end_time})
                         </li>
                       ))}
                     </ul>
                   </div>
                )}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
