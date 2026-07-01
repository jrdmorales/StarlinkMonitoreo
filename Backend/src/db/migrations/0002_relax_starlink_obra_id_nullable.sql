ALTER TABLE "starlink_accounts" DROP CONSTRAINT "starlink_accounts_obra_id_starlink_account_id_unique";--> statement-breakpoint
ALTER TABLE "antennas" ALTER COLUMN "code" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "starlink_accounts" ALTER COLUMN "obra_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "starlink_data_usage" ALTER COLUMN "obra_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "starlink_user_terminals" ALTER COLUMN "obra_id" DROP NOT NULL;--> statement-breakpoint
-- billing_cycle_end ya la agrega 0001 (parche manual posterior al generate original;
-- el snapshot de drizzle-kit había quedado desactualizado, por eso generate la repropuso acá).
ALTER TABLE "starlink_accounts" ADD CONSTRAINT "starlink_accounts_starlink_account_id_unique" UNIQUE("starlink_account_id");