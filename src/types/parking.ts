import { z } from "zod";

export const PaymentTypeEnum = z.enum([
	"FREE",
	"METERED",
	"TICKET",
	"PERMIT",
	"NO_PARKING",
]);
export type PaymentType = z.infer<typeof PaymentTypeEnum>;

// Zod schema for parking period from OpenAI response
export const ParkingPeriodInputSchema = z.object({
	time_limit_mins: z.number().nullable(),
	payment_type: PaymentTypeEnum,
	days_of_week: z.array(z.string()).default([]),
	start_time: z.string().nullable(),
	end_time: z.string().nullable(),
	special_conditions: z.string().optional().nullable(),
});

export type ParkingPeriodInput = z.infer<typeof ParkingPeriodInputSchema>;

// Zod schema for OpenAI response
export const OpenAIParkingResponseSchema = z.object({
	is_parking_sign: z.boolean(),
	description: z.string().optional(),
	periods: z.array(ParkingPeriodInputSchema).optional(),
	raw_text: z.string().optional(),
});

export type OpenAIParkingResponse = z.infer<typeof OpenAIParkingResponseSchema>;

export interface ParkingPeriod {
	id: string;
	parkingSpotId: string;
	timeLimitMins: number | null;
	paymentType: PaymentType;
	daysOfWeek: string[];
	startTime: string | null;
	endTime: string | null;
	specialConditions: string | null;
	createdAt: string | Date;
}

export interface ParkingSpot {
	id: string;
	latitude: number;
	longitude: number;
	imageUrl: string;
	description: string | null;
	rawText: string | null;
	periods: ParkingPeriod[];
	createdAt: string | Date;
}
