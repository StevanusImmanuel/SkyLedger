-- Create delivery_status enum
DO $$ BEGIN
 CREATE TYPE "public"."delivery_status" AS ENUM('booked', 'received_at_warehouse', 'security_cleared', 'manifested', 'departed', 'transshipment', 'arrived_at_destination', 'out_for_delivery', 'ready_for_pickup', 'delivered');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add delivery_status column to shipments table
ALTER TABLE "shipments" ADD COLUMN "delivery_status" "delivery_status" DEFAULT 'booked';
