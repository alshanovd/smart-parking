'use client';
import { useState, useRef } from 'react';
import { trpc } from '@/utils/trpc';
import { Button, Card, CardBody } from "@heroui/react";
import { FaCamera, FaLocationArrow } from 'react-icons/fa';
import Link from 'next/link';

export default function ContributorPage() {
  const [image, setImage] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.parking.uploadParkingPlate.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      }, (error) => {
        alert('Error getting location: ' + error.message);
      });
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const handleSubmit = async () => {
    if (!image || !coords) return;
    setLoading(true);
    try {
      await uploadMutation.mutateAsync({
        image,
        latitude: coords.lat,
        longitude: coords.lng,
      });
      alert('Uploaded successfully!');
      setImage(null);
      setCoords(null);
    } catch (error) {
      console.error(error);
      alert('Error uploading');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
       <Link href="/" className="text-blue-500 mb-4 block">← Back</Link>
       <Card className="max-w-md mx-auto">
         <CardBody className="gap-4">
           <h1 className="text-2xl font-bold text-center">Add Parking Spot</h1>
           
           <div 
             className="border-2 border-dashed border-gray-300 rounded-lg h-64 flex items-center justify-center cursor-pointer overflow-hidden bg-gray-50"
             onClick={() => fileInputRef.current?.click()}
           >
             {image ? (
               <img src={image} alt="Preview" className="w-full h-full object-cover" />
             ) : (
               <div className="flex flex-col items-center text-gray-400">
                 <FaCamera size={48} />
                 <span>Tap to take photo</span>
               </div>
             )}
           </div>
           <input 
             type="file" 
             accept="image/*" 
             capture="environment"
             ref={fileInputRef} 
             className="hidden" 
             onChange={handleFileChange}
           />

           <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
             <div>
               <p className="text-sm font-semibold">Location</p>
               <p className="text-xs text-gray-500">
                 {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Not set'}
               </p>
             </div>
             <Button size="sm" color="primary" variant="flat" onPress={getLocation}>
               <FaLocationArrow /> Use Current
             </Button>
           </div>

           <Button 
             color="primary" 
             isLoading={loading} 
             isDisabled={!image || !coords}
             onPress={handleSubmit}
             className="w-full"
           >
             Submit Parking Spot
           </Button>
         </CardBody>
       </Card>
    </div>
  );
}
