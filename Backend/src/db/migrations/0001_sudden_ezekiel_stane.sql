CREATE TABLE IF NOT EXISTS "starlink_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"obra_id" integer NOT NULL,
	"starlink_account_id" text NOT NULL,
	"client_id" text NOT NULL,
	"client_secret_encrypted" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "starlink_accounts_obra_id_starlink_account_id_unique" UNIQUE("obra_id","starlink_account_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "starlink_data_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"obra_id" integer NOT NULL,
	"starlink_account_id" uuid NOT NULL,
	"service_line_number" text NOT NULL,
	"billing_cycle_start" timestamp with time zone,
	"data_amount_gb" double precision NOT NULL,
	"raw_response" jsonb,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "starlink_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"starlink_account_id" uuid NOT NULL,
	"access_token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "starlink_tokens_starlink_account_id_unique" UNIQUE("starlink_account_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "starlink_user_terminals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"obra_id" integer NOT NULL,
	"starlink_account_id" uuid NOT NULL,
	"user_terminal_id" text NOT NULL,
	"dish_serial_number" text,
	"kit_serial_number" text,
	"service_line_number" text,
	"nickname" text,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "starlink_user_terminals_starlink_account_id_user_terminal_id_unique" UNIQUE("starlink_account_id","user_terminal_id")
);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS role varchar(20) DEFAULT 'admin' NOT NULL;

DO $$
BEGIN
    ALTER TABLE starlink_data_usage
    ADD CONSTRAINT fk_starlink_data_usage_account
    FOREIGN KEY (starlink_account_id)
    REFERENCES public.starlink_accounts(id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
    ALTER TABLE starlink_tokens
    ADD CONSTRAINT fk_starlink_tokens_account
    FOREIGN KEY (starlink_account_id)
    REFERENCES public.starlink_accounts(id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
    ALTER TABLE starlink_user_terminals
    ADD CONSTRAINT fk_starlink_user_terminals_account
    FOREIGN KEY (starlink_account_id)
    REFERENCES public.starlink_accounts(id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$$;
CREATE INDEX IF NOT EXISTS "idx_sl_usage_obra" ON "starlink_data_usage" USING btree ("obra_id");
CREATE INDEX IF NOT EXISTS "idx_sl_usage_service_line" ON "starlink_data_usage" USING btree ("service_line_number","fetched_at");
CREATE INDEX IF NOT EXISTS "idx_sl_terminals_obra" ON "starlink_user_terminals" USING btree ("obra_id");