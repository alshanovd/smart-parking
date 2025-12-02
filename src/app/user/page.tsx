"use client";
import { Button, Select, SelectItem, Spinner } from "@heroui/react";
import {
	GoogleMap,
	InfoWindow,
	Marker,
	useLoadScript,
} from "@react-google-maps/api";
import { keepPreviousData } from "@tanstack/react-query";
import Link from "next/link";
import { useCallback, useState } from "react";
import { FaLocationArrow } from "react-icons/fa";
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

const filterOptions = [
	{ key: "1P", label: "1P (60 min)" },
	{ key: "2P", label: "2P (120 min)" },
	{ key: "4P", label: "4P (240 min)" },
	{ key: "Loading", label: "Loading / Unrestricted" },
];

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
	const [filterValue, setFilterValue] = useState<string>("");
	const [appliedFilter, setAppliedFilter] = useState<string | undefined>(
		undefined,
	);

	const [markSize, setMarkSize] = useState<number>(50);

	const { data: spots, isFetching } = trpc.parking.getParkingSpots.useQuery(
		{ bounds: bounds!, filter: appliedFilter },
		{ enabled: !!bounds, placeholderData: keepPreviousData },
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

	const handleFilter = () => {
		setAppliedFilter(filterValue || undefined);
	};

	const handleReset = () => {
		setFilterValue("");
		setAppliedFilter(undefined);
	};

	const onZoomChanged = () => {
		const size = (map?.getZoom() || 15) * 5;
		setMarkSize(size);
	};

	const getLocation = () => {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const pos = {
						lat: position.coords.latitude,
						lng: position.coords.longitude,
					};
					map?.panTo(pos);
				},
				() => {
					alert("Error getting location");
				},
			);
		} else {
			alert("Geolocation is not supported");
		}
	};

	const getMarkerIcon = (spot: ParkingSpot) => {
		const isLoading = spot.periods.some(
			(p) =>
				p.specialConditions?.toLowerCase().includes("loading") ||
				spot.description?.toLowerCase().includes("loading"),
		);
		if (isLoading) return "/markers/Loading.png";

		const timeLimits = spot.periods
			.map((p) => p.timeLimitMins)
			.filter((t): t is number => t !== null);

		if (timeLimits.includes(60)) return "/markers/1P.png";
		if (timeLimits.includes(120)) return "/markers/2P.png";
		if (timeLimits.includes(240)) return "/markers/4P.png";

		return "/markers/2P.png"; // Default
	};

	const getMarkerColor = (spot: ParkingSpot) => {
		const isLoading = spot.periods.some(
			(p) =>
				p.specialConditions?.toLowerCase().includes("loading") ||
				spot.description?.toLowerCase().includes("loading"),
		);
		return isLoading ? "red" : "green";
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
			{/* Top Bar with Filter */}
			<div className="absolute top-4 left-4 right-4 z-10 flex flex-col md:flex-row gap-2 items-start md:items-center pointer-events-none">
				<Link href="/" className="pointer-events-auto">
					<div className="bg-slate-900/90 backdrop-blur border border-slate-700 text-slate-200 px-4 py-2 rounded-lg shadow-lg font-medium cursor-pointer hover:bg-slate-800 transition-colors flex items-center gap-2">
						← Back
					</div>
				</Link>

				<div className="flex-1" />

				<div className="select-parking-filter flex gap-2 pointer-events-auto bg-slate-900/90 backdrop-blur border border-slate-700 p-2 rounded-xl shadow-lg w-full md:w-auto">
					<Select
						placeholder="Parking Period"
						className="w-60"
						size="sm"
						selectedKeys={filterValue ? [filterValue] : []}
						onChange={(e) => setFilterValue(e.target.value)}
						isDisabled={isFetching}
					>
						{filterOptions.map((option) => (
							<SelectItem
								key={option.key}
								className="bg-slate-900/90 backdrop-blur border border-slate-700 px-4 py-2"
							>
								{option.label}
							</SelectItem>
						))}
					</Select>
					<Button
						color="primary"
						size="sm"
						onPress={handleFilter}
						className="font-semibold"
					>
						Filter
					</Button>
					<Button color="danger" variant="flat" size="sm" onPress={handleReset}>
						Reset
					</Button>
				</div>
			</div>

			<GoogleMap
				onZoomChanged={onZoomChanged}
				mapContainerStyle={mapContainerStyle}
				zoom={15}
				center={center}
				onLoad={onMapLoad}
				onIdle={onBoundsChanged}
				options={{
					disableDefaultUI: false,
					zoomControl: true,
					mapTypeControl: false,
					streetViewControl: false,
					fullscreenControl: false,
					gestureHandling: "greedy",
				}}
			>
				{spots?.map((spot) => (
					<Marker
						key={spot.id}
						position={{ lat: spot.latitude, lng: spot.longitude }}
						onClick={() => setSelectedSpot(spot)}
						icon={{
							url: getMarkerIcon(spot),
							scaledSize: new google.maps.Size(markSize, markSize),
						}}
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
							<div
								className={`p-2 rounded-t-lg text-white font-bold text-center mb-2 ${
									getMarkerColor(selectedSpot) === "red"
										? "bg-red-600"
										: "bg-green-600"
								}`}
							>
								{getMarkerColor(selectedSpot) === "red"
									? "Loading Zone"
									: "Parking Spot"}
							</div>
							<div className="px-1">
								{selectedSpot.imageUrl &&
									selectedSpot.imageUrl !== "placeholder" && (
										<img
											src={selectedSpot.imageUrl}
											alt="Sign"
											className="w-full h-32 object-cover mb-2 rounded-lg border border-slate-200"
										/>
									)}
								<div className="text-sm">
									{selectedSpot.description && (
										<p className="mb-2">
											<strong>Description:</strong> {selectedSpot.description}
										</p>
									)}

									{selectedSpot.periods && selectedSpot.periods.length > 0 && (
										<div className="mt-2 p-2 bg-slate-100 rounded border border-slate-200">
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
						</div>
					</InfoWindow>
				)}
			</GoogleMap>

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
		</div>
	);
}
