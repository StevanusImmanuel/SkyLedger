ALTER TABLE "airports" ADD COLUMN IF NOT EXISTS "latitude" numeric(9, 6);--> statement-breakpoint
ALTER TABLE "airports" ADD COLUMN IF NOT EXISTS "longitude" numeric(9, 6);
