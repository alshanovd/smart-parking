import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import { z } from "zod";
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
        - restrictions: Array of objects with fields:
          - start_time (string, e.g. "08:00")
          - end_time (string, e.g. "18:00")
          - days (array of strings, e.g. ["Mon", "Fri"])
          - limit (string, e.g. "2P", "4P")
          - type (string, e.g. "meter", "ticket", "free")
        - raw_text: All text on the sign.
        - summary: A short human-readable summary of the rules.
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
			const parsedData = content ? JSON.parse(content) : null;

			if (!parsedData || parsedData.is_parking_sign === false) {
				throw new Error("Could not recognize a parking sign in this image.");
			}

			// 3. Save to DB
			const spot = await prisma.parkingSpot.create({
				data: {
					latitude,
					longitude,
					imageUrl: publicUrl || "placeholder", // Fallback if upload fails
					rawText: parsedData?.raw_text || "",
					parsedData: parsedData || {},
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
			});
			return spots.map((spot) => ({
				...spot,
				parsedData: spot.parsedData as unknown,
			}));
		}),
});
