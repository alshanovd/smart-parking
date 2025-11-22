import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import { z } from "zod";
import { OpenAIParkingResponseSchema } from "@/types/parking";
import { supabase } from "@/utils/supabase";
import { publicProcedure, router } from "../trpc";

const prisma = new PrismaClient();
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

export const parkingRouter = router({
	uploadParkingPlate: publicProcedure
		.input(
			z.object({
				image: z.string(), // Base64
				latitude: z.number(),
				longitude: z.number(),
			}),
		)
		.mutation(async ({ input }) => {
			const { image, latitude, longitude } = input;

			// 1. Upload to Supabase Storage (Optional for now, but good practice)
			// We need to convert base64 to Blob/Buffer.
			// For simplicity, we'll skip storage if it's complex to setup without bucket,
			// but we'll try to just use the base64 for OpenAI.
			// Ideally we store the image url. Let's assume we just store the base64 in DB?
			// No, too large.
			// Let's try to upload to a bucket 'parking-plates'.

			let publicUrl = "";
			try {
				const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
				const buffer = Buffer.from(base64Data, "base64");
				const fileName = `${Date.now()}.png`;

				const { data, error } = await supabase.storage
					.from("parking-plates")
					.upload(fileName, buffer, {
						contentType: "image/png",
					});

				if (!error && data) {
					const { data: publicUrlData } = supabase.storage
						.from("parking-plates")
						.getPublicUrl(fileName);
					publicUrl = publicUrlData.publicUrl;
				}
			} catch (e) {
				console.error("Upload failed", e);
			}

			// 2. Call OpenAI
			const prompt = `
        Analyze this image. First, determine if this is a street parking sign or plate.
        If it is NOT a parking sign, return JSON with "is_parking_sign": false.
        If it IS a parking sign, return JSON with:
        - "is_parking_sign": true
        - "description": A brief human-readable description of the parking spot
        - "periods": Array of parking period objects with fields:
          - "time_limit_mins": Number of minutes allowed (e.g., 15, 30, 60, 120) or null for unrestricted
          - "payment_type": One of "FREE", "METERED", "TICKET", "PERMIT", "NO_PARKING"
          - "days_of_week": Array of day codes (e.g., ["MON", "TUE", "WED", "THU", "FRI"]) or empty array for all days
          - "start_time": Start time in 24h format (e.g., "08:00") or null for all day
          - "end_time": End time in 24h format (e.g., "18:00") or null for all day
          - "special_conditions": Any special notes (e.g., "Except Public Holidays", "Loading Zone")
        - "raw_text": All text visible on the sign.
        
        Examples:
        - "2P Mon-Fri 8am-6pm Meter" → time_limit_mins: 120, payment_type: "METERED", days_of_week: ["MON","TUE","WED","THU","FRI"], start_time: "08:00", end_time: "18:00"
        - "1/2P Ticket" → time_limit_mins: 30, payment_type: "TICKET", days_of_week: [], start_time: null, end_time: null
        - "No Parking 7am-9am Mon-Fri" → time_limit_mins: null, payment_type: "NO_PARKING", days_of_week: ["MON","TUE","WED","THU","FRI"], start_time: "07:00", end_time: "09:00"
      `;

			const response = await openai.chat.completions.create({
				model: "gpt-4o",
				messages: [
					{
						role: "user",
						content: [
							{ type: "text", text: prompt },
							{ type: "image_url", image_url: { url: image } },
						],
					},
				],
				response_format: { type: "json_object" },
			});

			const content = response.choices[0].message.content;
			if (!content) {
				throw new Error("No response from OpenAI");
			}

			// Parse and validate the OpenAI response with Zod
			const parsedJson = JSON.parse(content);
			const parsedData = OpenAIParkingResponseSchema.parse(parsedJson);

			if (!parsedData.is_parking_sign) {
				throw new Error("Could not recognize a parking sign in this image.");
			}

			// 3. Save to DB with parking periods
			const spot = await prisma.parkingSpot.create({
				data: {
					latitude,
					longitude,
					imageUrl: publicUrl || "placeholder", // Fallback if upload fails
					description: parsedData.description || null,
					rawText: parsedData.raw_text || null,
					periods: {
						create: (parsedData.periods || []).map((period) => ({
							timeLimitMins: period.time_limit_mins,
							paymentType: period.payment_type,
							daysOfWeek: period.days_of_week,
							startTime: period.start_time,
							endTime: period.end_time,
							specialConditions: period.special_conditions || null,
						})),
					},
				},
				include: {
					periods: true,
				},
			});

			return spot;
		}),

	getParkingSpots: publicProcedure
		.input(
			z.object({
				bounds: z.object({
					north: z.number(),
					south: z.number(),
					east: z.number(),
					west: z.number(),
				}),
			}),
		)
		.query(async ({ input }) => {
			const { bounds } = input;
			// Simple rectangular bounds query
			const spots = await prisma.parkingSpot.findMany({
				where: {
					latitude: {
						gte: bounds.south,
						lte: bounds.north,
					},
					longitude: {
						gte: bounds.west,
						lte: bounds.east,
					},
				},
				include: {
					periods: true, // Include related parking periods
				},
			});
			return spots;
		}),
});
