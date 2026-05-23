-- seed: system categories (user_id = null)
-- `slug` is the stable key; the label is translated via next-intl (rituals.category.system.<slug>).
-- `name` holds the English label (used as a fallback / source of the slug).
insert into ritual_categories (id, user_id, slug, name, description) values
    (gen_random_uuid(), null, 'movement',   'Movement',   'Physical activity and exercise'),
    (gen_random_uuid(), null, 'nutrition',  'Nutrition',  'Eating habits and hydration'),
    (gen_random_uuid(), null, 'balance',    'Balance',    'Rest, mental health, and self-care'),
    (gen_random_uuid(), null, 'learning',   'Learning',   'Reading, study, and growth'),
    (gen_random_uuid(), null, 'creativity', 'Creativity', 'Art, music, writing, and creative work'),
    (gen_random_uuid(), null, 'focus',      'Focus',      'Work, side projects, and deep work');