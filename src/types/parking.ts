export interface ParkingRestriction {
	start_time: string;
	end_time: string;
	days: string[];
	limit: string;
	type: string;
}

export interface ParsedParkingData {
	is_parking_sign: boolean;
	restrictions?: ParkingRestriction[];
	raw_text?: string;
	summary?: string;
}

export interface ParkingSpot {
	id: string;
	latitude: number;
	longitude: number;
	imageUrl: string;
	rawText: string | null;
	parsedData?: ParsedParkingData | null | unknown;
	createdAt: string | Date;
}
