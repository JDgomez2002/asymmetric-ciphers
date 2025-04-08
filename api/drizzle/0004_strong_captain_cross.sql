ALTER TABLE "files" ADD COLUMN "size" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "content_type" varchar(255);--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;