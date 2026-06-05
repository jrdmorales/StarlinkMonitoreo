CREATE TABLE IF NOT EXISTS "alert_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"antenna_id" integer NOT NULL,
	"threshold" smallint NOT NULL,
	"cycle_start" date NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "alert_antenna_threshold_cycle_uniq" UNIQUE("antenna_id","threshold","cycle_start")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "antennas" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"obra_id" integer,
	"name" varchar(255),
	"limit_gb" integer DEFAULT 2000 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "antennas_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "consumption_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"antenna_id" integer NOT NULL,
	"sampled_at" timestamp with time zone NOT NULL,
	"cycle_start" date NOT NULL,
	"cycle_end" date NOT NULL,
	"consumed_gb" numeric(10, 2) NOT NULL,
	"limit_gb" integer NOT NULL,
	"usage_pct" numeric(5, 2) NOT NULL,
	CONSTRAINT "consumption_antenna_time_uniq" UNIQUE("antenna_id","sampled_at")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "obras" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(50) NOT NULL,
	"label" varchar(100) NOT NULL,
	"prefix" varchar(10) NOT NULL,
	"email" varchar(255) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "obras_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alert_log" ADD CONSTRAINT "alert_log_antenna_id_antennas_id_fk" FOREIGN KEY ("antenna_id") REFERENCES "public"."antennas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "antennas" ADD CONSTRAINT "antennas_obra_id_obras_id_fk" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "consumption_logs" ADD CONSTRAINT "consumption_logs_antenna_id_antennas_id_fk" FOREIGN KEY ("antenna_id") REFERENCES "public"."antennas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_consumption_antenna_time" ON "consumption_logs" USING btree ("antenna_id","sampled_at");