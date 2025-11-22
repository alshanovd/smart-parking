"use client";

import { Button, Card, CardBody } from "@heroui/react";
import Link from "next/link";
import { FaCamera, FaMapMarkedAlt } from "react-icons/fa";

export default function Home() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-4">
			<h1 className="text-4xl font-bold text-slate-100 mb-2 text-center">
				SmartParking
			</h1>
			<p className="text-slate-400 mb-8 text-center max-w-md">
				Find parking spots or contribute to the community.
			</p>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full mx-auto place-items-center">
				<Link
					href="/contributor"
					className="w-full block max-w-sm md:max-w-none"
				>
					<Card className="hover:scale-105 transition-transform cursor-pointer h-64 bg-slate-900 border border-slate-800 w-full">
						<CardBody className="flex flex-col items-center justify-center gap-4 h-full">
							<FaCamera className="text-6xl text-blue-400" />
							<h2 className="text-2xl font-bold text-slate-200">Contributor</h2>
							<p className="text-center text-slate-400">
								Upload parking plates and help others.
							</p>
						</CardBody>
					</Card>
				</Link>
				<Link href="/user" className="w-full block max-w-sm md:max-w-none">
					<Card className="hover:scale-105 transition-transform cursor-pointer h-64 bg-slate-900 border border-slate-800 w-full">
						<CardBody className="flex flex-col items-center justify-center gap-4 h-full">
							<FaMapMarkedAlt className="text-6xl text-emerald-400" />
							<h2 className="text-2xl font-bold text-slate-200">
								Find Parking
							</h2>
							<p className="text-center text-slate-400">
								Find suitable parking spots on the map.
							</p>
						</CardBody>
					</Card>
				</Link>
			</div>
		</div>
	);
}
