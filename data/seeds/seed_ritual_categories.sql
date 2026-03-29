-- seed: system categories (user_id = null)
insert into ritual_categories (id, user_id, name, description, icon, color) values
    (gen_random_uuid(), null, 'Sport',                'Physical activity and exercise',          '🏃', '#f97316'),
    (gen_random_uuid(), null, 'Nutrition',            'Eating habits and hydration',             '🥗', '#84cc16'),
    (gen_random_uuid(), null, 'Well-being',           'Mental health, meditation, and self-care','🧘', '#a78bfa'),
    (gen_random_uuid(), null, 'Personal development', 'Learning, reading, and growth',           '📚', '#60a5fa'),
    (gen_random_uuid(), null, 'Sleep',                'Sleep quality and rest routines',         '😴', '#818cf8'),
    (gen_random_uuid(), null, 'Creativity',           'Art, music, writing, and creative work',  '🎨', '#f472b6');