# DAAN DOOLE migration plan

## Goal
Transform the existing mobile-first SamaVolaille app into a Senegal-focused platform for creating digital product catalogs and online stores. Keep the original `main` branch untouched while work happens on `feature/daan-doole-foundation`.

## Phase 1 — foundation
- Keep existing poultry tables and data intact.
- Add tenant-aware `stores` and `store_products` tables through an additive Supabase migration.
- Use a unique store slug for public links, for example `/boutique/nom-du-commerce`.
- Enforce Row Level Security so public visitors see only published stores/products and store owners manage only their own store data.
- Keep platform-controlled ownership, plan, and suspension fields protected.

## Phase 2 — user experience
- Replace poultry-specific home and navigation with DAAN DOOLE branding.
- Build a mobile-first public store page and catalog view.
- Build a store-owner dashboard for product CRUD, images, categories, prices, stock, and publication state.
- Build a platform-admin workflow to create a store for a client and associate it with that client's authenticated account.

## Phase 3 — online-store features
- Add cart and order management only after the catalog flow is stable.
- Evaluate local payment options separately before promising online payments.
- Add optional custom domains as a later paid feature.

## Safety and rollout
- Do not run the new migration against production until the existing Supabase project is backed up and the migration has been reviewed.
- Apply migrations in a test/staging Supabase project first where possible.
- Test tenant isolation with at least two different store-owner accounts before launch.
- Do not merge the feature branch into `main` until the app builds and the store-isolation tests pass.
