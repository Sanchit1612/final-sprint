-- Structural rows only (the four Core CS subjects and three development tracks the product is built around).
-- No educational content is seeded: topics, problems, questions and resources arrive via the import script.

insert into public.core_subjects (slug, title, description, position) values
  ('dbms', 'Database Management Systems', null, 1),
  ('os',   'Operating Systems',            null, 2),
  ('cn',   'Computer Networks',            null, 3),
  ('oop',  'Object-Oriented Programming',  null, 4)
on conflict (slug) do nothing;

insert into public.development_tracks (slug, title, description, position, is_pro) values
  ('full-stack', 'Full Stack Development', null, 1, true),
  ('machine-learning', 'Machine Learning', null, 2, true),
  ('ai-llm', 'AI and LLM Development', null, 3, true)
on conflict (slug) do nothing;
