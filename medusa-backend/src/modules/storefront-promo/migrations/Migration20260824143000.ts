import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260824143000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table if not exists "storefront_promo" ("id" text not null, "key" text not null, "active" boolean not null default true, "campaign_name" text not null, "headline" text not null, "supporting_copy" text not null, "cta_label" text not null, "cta_href" text not null, "hero_image_url" text not null, "products" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "storefront_promo_pkey" primary key ("id"));`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_storefront_promo_key_unique" ON "storefront_promo" ("key") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_storefront_promo_deleted_at" ON "storefront_promo" ("deleted_at") WHERE deleted_at IS NULL;`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "storefront_promo" cascade;`)
  }
}
