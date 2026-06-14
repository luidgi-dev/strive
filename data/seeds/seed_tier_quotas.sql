-- reference data: monthly AI credit quota per membership tier.
-- safe to re-run; on conflict refreshes the quota so changing a number here and
-- re-seeding is enough to update it everywhere (guard + monthly reset read this).

insert into tier_quotas (tier, monthly_quota) values
    ('lite', 5),
    ('premium', 300),
    ('lifetime', 150)
on conflict (tier) do update set monthly_quota = excluded.monthly_quota;
