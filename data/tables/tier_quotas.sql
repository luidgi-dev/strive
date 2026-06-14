-- tier_quotas
-- reference table: monthly AI credit quota per membership tier
-- single source of truth shared by the credit guard and the monthly reset job

drop table if exists tier_quotas cascade;

create table tier_quotas (
    tier          text primary key check (tier in ('lite','premium','lifetime')),
    monthly_quota int not null check (monthly_quota >= 0)
);

-- rls
alter table tier_quotas enable row level security;

-- read-only reference data: any authenticated user may read the quotas.
-- rows are managed via sql / service role only (no write policy on purpose).
create policy "authenticated users can read tier quotas"
    on tier_quotas for select
    to authenticated
    using (true);
