"use client";
import { Spinner } from "@heroui/react";
import {
	GoogleMap,
	InfoWindow,
	Marker,
	useLoadScript,
} from "@react-google-maps/api";
import Link from "next/link";
import { useCallback, useState } from "react";
import type { ParkingSpot } from "@/types/parking";
import { trpc } from "@/utils/trpc";

const mapContainerStyle = {
	width: "100%",
	height: "100vh",
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
	const [bounds, setBounds] = useState<{
		north: number;
		south: number;
		east: number;
		west: number;
	} | null>(null);
	const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);

	const { data: spots } = trpc.parking.getParkingSpots.useQuery(
		{ bounds: bounds! },
		{ enabled: !!bounds },
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
	if (!isLoaded)
		return (
			<div className="flex h-screen items-center justify-center">
				<Spinner size="lg" />
			</div>
		);

	return (
		<div className="relative h-screen w-full bg-slate-950">
			<div className="absolute top-15 left-4 z-10">
				<Link href="/">
					<div className="bg-slate-900/90 backdrop-blur border border-slate-700 text-slate-200 px-4 py-2 rounded-lg shadow-lg font-medium cursor-pointer hover:bg-slate-800 transition-colors flex items-center gap-2">
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
						position={{
							lat: selectedSpot.latitude,
							lng: selectedSpot.longitude,
						}}
						onCloseClick={() => setSelectedSpot(null)}
					>
						<div className="max-w-xs text-slate-800">
							<h3 className="font-bold mb-2 text-lg">Parking Info</h3>
							{selectedSpot.imageUrl &&
								selectedSpot.imageUrl !== "placeholder" && (
									<img
										src={selectedSpot.imageUrl}
										alt="Sign"
										className="w-full h-32 object-cover mb-2 rounded-lg"
									/>
								)}
							<div className="text-sm">
								{selectedSpot.description && (
									<p className="mb-2">
										<strong>Description:</strong> {selectedSpot.description}
									</p>
								)}

								{selectedSpot.periods && selectedSpot.periods.length > 0 && (
									<div className="mt-2 p-2 bg-slate-100 rounded">
										<strong>Parking Periods:</strong>
										<ul className="list-disc pl-4 mt-1 space-y-2">
											{selectedSpot.periods.map((period) => (
												<li key={period.id}>
													<div>
														<span className="font-semibold">
															{period.timeLimitMins
																? `${period.timeLimitMins} min`
																: "Unrestricted"}{" "}
															- {period.paymentType}
														</span>
														{period.daysOfWeek.length > 0 && (
															<div className="text-xs text-slate-600">
																Days: {period.daysOfWeek.join(", ")}
															</div>
														)}
														{(period.startTime || period.endTime) && (
															<div className="text-xs text-slate-600">
																Time: {period.startTime || "00:00"} -{" "}
																{period.endTime || "23:59"}
															</div>
														)}
														{period.specialConditions && (
															<div className="text-xs text-slate-500 italic">
																{period.specialConditions}
															</div>
														)}
													</div>
												</li>
											))}
										</ul>
									</div>
								)}

								{selectedSpot.rawText && (
									<p className="mt-2 text-xs text-slate-600">
										<strong>Raw Text:</strong> {selectedSpot.rawText}
									</p>
								)}
							</div>
						</div>
					</InfoWindow>
				)}
			</GoogleMap>
		</div>
	);
}
