'use client';

import { Card, CardBody, Button } from "@heroui/react";
import Link from "next/link";
import { FaCamera, FaMapMarkedAlt } from "react-icons/fa";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <h1 className="text-4xl font-bold text-white mb-8">SmartParking</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
        <Link href="/contributor" className="w-full">
          <Card className="hover:scale-105 transition-transform cursor-pointer h-64">
            <CardBody className="flex flex-col items-center justify-center gap-4">
              <FaCamera className="text-6xl text-blue-500" />
              <h2 className="text-2xl font-bold">Contributor</h2>
              <p className="text-center text-gray-500">Upload parking plates and help others.</p>
            </CardBody>
          </Card>
        </Link>
        <Link href="/user" className="w-full">
          <Card className="hover:scale-105 transition-transform cursor-pointer h-64">
            <CardBody className="flex flex-col items-center justify-center gap-4">
              <FaMapMarkedAlt className="text-6xl text-purple-500" />
              <h2 className="text-2xl font-bold">Find Parking</h2>
              <p className="text-center text-gray-500">Find suitable parking spots on the map.</p>
            </CardBody>
          </Card>
        </Link>
      </div>
    </div>
  );
}
