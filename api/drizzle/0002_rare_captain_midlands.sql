ALTER TABLE "files" RENAME COLUMN "path" TO "content";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "public_key" SET DATA TYPE varchar(1024);--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "hash" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "signature" varchar(1024) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "asymmetric_key" varchar(2048);--> statement-breakpoint
ALTER TABLE "files" DROP COLUMN "content_type";