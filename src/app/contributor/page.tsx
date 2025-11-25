"use client";
import { Button, Card, CardBody, Spinner } from "@heroui/react";
import { GoogleMap, useLoadScript } from "@react-google-maps/api";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { FaCamera, FaLocationArrow, FaMapMarkerAlt } from "react-icons/fa";
import { trpc } from "@/utils/trpc";

const mapContainerStyle = {
	width: "100%",
	height: "100%",
};

const defaultCenter = {
	lat: -33.8688, // Sydney
	lng: 151.2093,
};

export default function ContributorPage() {
	const [image, setImage] = useState<string | null>(null);
	const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
		null,
	);
	const [loading, setLoading] = useState(false);
	const [showMap, setShowMap] = useState(false);
	const [mapCenter, setMapCenter] = useState(defaultCenter);
	const mapRef = useRef<google.maps.Map | null>(null);

	const fileInputRef = useRef<HTMLInputElement>(null);

	const { isLoaded } = useLoadScript({
		googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
	});

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
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const newCoords = {
						lat: position.coords.latitude,
						lng: position.coords.longitude,
					};
					setCoords(newCoords);
					setMapCenter(newCoords);
					if (mapRef.current) {
						mapRef.current.panTo(newCoords);
					}
				},
				(error) => {
					alert(`Error getting location: ${error.message}`);
				},
			);
		} else {
			alert("Geolocation is not supported by this browser.");
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
			alert("Uploaded successfully!");
			setImage(null);
			setCoords(null);
		} catch (error) {
			console.error(error);
			alert("Error uploading");
		} finally {
			setLoading(false);
		}
	};

	const onMapLoad = useCallback((map: google.maps.Map) => {
		mapRef.current = map;
	}, []);

	const handleCenterChanged = () => {
		if (mapRef.current) {
			const center = mapRef.current.getCenter();
			if (center) {
				setMapCenter({ lat: center.lat(), lng: center.lng() });
			}
		}
	};

	const confirmMapLocation = () => {
		setCoords(mapCenter);
		setShowMap(false);
	};

	if (showMap) {
		if (!isLoaded) return <Spinner size="lg" />;
		return (
			<div className="fixed inset-0 z-50 bg-slate-950">
				<div className="absolute top-4 left-4 z-10">
					<Button
						onPress={() => setShowMap(false)}
						className="bg-slate-900/90 backdrop-blur border border-slate-700 text-slate-200 px-4 py-2 rounded-lg shadow-lg font-medium cursor-pointer hover:bg-slate-800 transition-colors flex items-center gap-2"
					>
						← Back
					</Button>
				</div>

				<div className="absolute inset-0">
					<GoogleMap
						mapContainerStyle={mapContainerStyle}
						zoom={18}
						center={coords || defaultCenter}
						onLoad={onMapLoad}
						onCenterChanged={handleCenterChanged}
						options={{
							disableDefaultUI: true,
							zoomControl: false,
						}}
					/>
					{/* Center Crosshair */}
					<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
						<FaMapMarkerAlt className="text-red-500 text-4xl -mt-8" />
					</div>

					{/* "I'm here" button */}
					<div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10">
						<Button
							isIconOnly
							className="bg-white text-slate-900 shadow-lg rounded-full p-3"
							onPress={getLocation}
						>
							<FaLocationArrow size={20} />
						</Button>
					</div>

					{/* "The plate is here" button */}
					<div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-xs px-4">
						<Button
							color="primary"
							className="bg-slate-900/90 backdrop-blur border border-slate-700 text-slate-200 px-4 py-2 rounded-lg shadow-lg font-medium cursor-pointer hover:bg-slate-800 transition-colors flex items-center gap-2"
							size="lg"
							onPress={confirmMapLocation}
						>
							The plate is here
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-950 p-4 flex flex-col items-center justify-center">
			<div className="absolute top-4 left-4 z-10">
				<Link href="/">
					<div className="bg-slate-900/90 backdrop-blur border border-slate-700 text-slate-200 px-4 py-2 rounded-lg shadow-lg font-medium cursor-pointer hover:bg-slate-800 transition-colors flex items-center gap-2">
						← Back
					</div>
				</Link>
			</div>

			<Card className="max-w-md w-full bg-slate-900 border border-slate-800">
				<CardBody className="gap-6 p-6">
					<h1 className="text-2xl font-bold text-center text-slate-100">
						Add Parking Spot
					</h1>

					<div
						className="border-2 border-dashed border-slate-700 rounded-xl h-64 flex items-center justify-center cursor-pointer overflow-hidden bg-slate-800/50 hover:bg-slate-800 transition-colors group"
						onClick={() => fileInputRef.current?.click()}
					>
						{image ? (
							<img
								src={image}
								alt="Preview"
								className="w-full h-full object-cover"
							/>
						) : (
							<div className="flex flex-col items-center text-slate-500 group-hover:text-slate-400 transition-colors">
								<FaCamera size={48} className="mb-2" />
								<span className="text-sm font-medium">Tap to take photo</span>
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

					<div className="flex flex-col gap-3 bg-slate-800 p-4 rounded-xl border border-slate-700 w-full">
						<div className="w-full">
							<p className="text-sm font-semibold text-slate-300 mb-3">
								Location
							</p>

							<div className="flex flex-col gap-3">
								<div className="flex flex-col gap-1">
									<label
										htmlFor="latitude"
										className="text-xs text-slate-400 font-medium"
									>
										Latitude
									</label>
									<input
										id="latitude"
										type="number"
										step="any"
										value={coords?.lat ?? ""}
										onChange={(e) => {
											const value = e.target.value;
											if (value === "") {
												setCoords(null);
											} else {
												setCoords({
													lat: parseFloat(value),
													lng: coords?.lng ?? 0,
												});
											}
										}}
										placeholder="Enter latitude"
										className="bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
									/>
								</div>

								<div className="flex flex-col gap-1">
									<label
										htmlFor="longitude"
										className="text-xs text-slate-400 font-medium"
									>
										Longitude
									</label>
									<input
										id="longitude"
										type="number"
										step="any"
										value={coords?.lng ?? ""}
										onChange={(e) => {
											const value = e.target.value;
											if (value === "") {
												setCoords(null);
											} else {
												setCoords({
													lat: coords?.lat ?? 0,
													lng: parseFloat(value),
												});
											}
										}}
										placeholder="Enter longitude"
										className="bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
									/>
								</div>
							</div>
						</div>

						<div className="flex gap-2">
							<Button
								size="sm"
								color="primary"
								variant="flat"
								onPress={getLocation}
								className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 flex-1 rounded-sm py-2 flex"
							>
								<FaLocationArrow /> My Coordinates
							</Button>
							<Button
								size="sm"
								color="secondary"
								variant="flat"
								onPress={() => setShowMap(true)}
								className="flex bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 flex-1 rounded-sm py-2"
							>
								<FaMapMarkerAlt /> Point on map
							</Button>
						</div>
					</div>

					<Button
						color="primary"
						isLoading={loading}
						spinner={
							<svg
								className="animate-spin h-5 w-5 text-current"
								fill="none"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
							>
								<title>spinner</title>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								/>
								<path
									className="opacity-75"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									fill="currentColor"
								/>
							</svg>
						}
						isDisabled={!image || !coords || loading}
						onPress={handleSubmit}
						className="w-full font-semibold bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-500/30 disabled:text-gray-100/70 hover:bg-blue-600 py-2 rounded-md flex"
					>
						Submit Parking Spot
					</Button>
				</CardBody>
			</Card>
		</div>
	);
}
