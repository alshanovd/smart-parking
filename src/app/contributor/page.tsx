"use client";
import { Button, Card, CardBody } from "@heroui/react";
import Link from "next/link";
import { useRef, useState } from "react";
import { FaCamera, FaLocationArrow } from "react-icons/fa";
import { trpc } from "@/utils/trpc";

export default function ContributorPage() {
	const [image, setImage] = useState<string | null>(null);
	const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
		null,
	);
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
			navigator.geolocation.getCurrentPosition(
				(position) => {
					setCoords({
						lat: position.coords.latitude,
						lng: position.coords.longitude,
					});
				},
				(error) => {
					alert("Error getting location: " + error.message);
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

					<div className="flex flex-col items-center gap-3 bg-slate-800 p-4 rounded-xl border border-slate-700 w-full">
						<div className="text-center w-full">
							<p className="text-sm font-semibold text-slate-300">Location</p>
							<p className="text-xs text-slate-500 font-mono mt-1">
								{coords
									? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
									: "Not set"}
							</p>
						</div>
						<Button
							size="sm"
							color="primary"
							variant="flat"
							onPress={getLocation}
							className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 w-full max-w-xs flex rounded-sm py-2"
						>
							<FaLocationArrow /> Use Current Location
						</Button>
					</div>

					<Button
						color="primary"
						isLoading={loading}
						isDisabled={!image || !coords}
						onPress={handleSubmit}
						className="w-full font-semibold bg-blue-500 hover:bg-blue-600 py-2 rounded-md"
					>
						Submit Parking Spot
					</Button>
				</CardBody>
			</Card>
		</div>
	);
}
