import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260807205603 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "pickup_verification" drop constraint if exists "pickup_verification_token_hash_unique";`);
    this.addSql(`alter table if exists "pickup_verification" drop constraint if exists "pickup_verification_order_id_unique";`);
    this.addSql(`create table if not exists "pickup_verification" ("id" text not null, "order_id" text not null, "token_hash" text not null, "token_expires_at" timestamptz null, "status" text check ("status" in ('active', 'processing', 'completed', 'revoked', 'expired')) not null default 'active', "requires_age_verification" boolean not null default true, "age_verified" boolean null, "verification_method" text check ("verification_method" in ('manual_dob', 'id_scan', 'visual_check')) null, "completed_at" timestamptz null, "completed_by" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "pickup_verification_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_pickup_verification_order_id_unique" ON "pickup_verification" ("order_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_pickup_verification_token_hash_unique" ON "pickup_verification" ("token_hash") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pickup_verification_deleted_at" ON "pickup_verification" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "pickup_audit_event" ("id" text not null, "order_id" text not null, "employee_id" text null, "event_type" text check ("event_type" in ('pickup_qr_scanned', 'order_opened_for_verification', 'age_verification_passed', 'age_verification_failed', 'pickup_completed')) not null, "verification_method" text check ("verification_method" in ('manual_dob', 'id_scan', 'visual_check')) null, "result" text null, "metadata" jsonb null, "verification_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "pickup_audit_event_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pickup_audit_event_verification_id" ON "pickup_audit_event" ("verification_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pickup_audit_event_deleted_at" ON "pickup_audit_event" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "pickup_audit_event" add constraint "pickup_audit_event_verification_id_foreign" foreign key ("verification_id") references "pickup_verification" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "pickup_audit_event" drop constraint if exists "pickup_audit_event_verification_id_foreign";`);

    this.addSql(`drop table if exists "pickup_verification" cascade;`);

    this.addSql(`drop table if exists "pickup_audit_event" cascade;`);
  }

}
