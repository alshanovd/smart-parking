# SmartParking

Smart parking application with Contributor and User modes. You might check the app out [here](https://smart-parking-azure.vercel.app/).

## Features
- **Contributor Mode**: Upload parking plate photos, extract data using AI, and save to database.
- **User Mode**: View parking spots on a map with details.

## Tech Stack
- Next.js
- Prisma (PostgreSQL on Supabase)
- tRPC
- Tailwind CSS + HeroUI
- OpenAI API (GPT-4o)
- Google Maps API

## Deployment

1. **Database**: Ensure your Supabase project is set up.
2. **Environment Variables**: Set the following variables in Vercel:
   - `DATABASE_URL`: Connection string (Pooled)
   - `DIRECT_URL`: Connection string (Direct)
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anon Key
   - `OPENAI_API_KEY`: OpenAI API Key
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps API Key (Enable Maps JavaScript API)

3. **Build Command**: `npm run build` (which runs `prisma generate && next build`)
4. **Install Command**: `npm install`

## Local Development

1. `npm install`
2. `npx prisma generate`
3. `npm run dev`
