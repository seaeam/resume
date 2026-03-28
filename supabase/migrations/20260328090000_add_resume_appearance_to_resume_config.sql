alter table public.resume_config
  add column if not exists spacing jsonb,
  add column if not exists font jsonb,
  add column if not exists theme jsonb;

update public.resume_config
set
  spacing = coalesce(spacing, '{"sectionSpacing":20,"lineHeight":1.6,"pageMargin":16}'::jsonb),
  font = coalesce(font, '{"fontFamily":"system","fontSize":14}'::jsonb),
  theme = coalesce(theme, '{"theme":"default"}'::jsonb)
where spacing is null
  or font is null
  or theme is null;

alter table public.resume_config
  alter column spacing set default '{"sectionSpacing":20,"lineHeight":1.6,"pageMargin":16}'::jsonb,
  alter column spacing set not null,
  alter column font set default '{"fontFamily":"system","fontSize":14}'::jsonb,
  alter column font set not null,
  alter column theme set default '{"theme":"default"}'::jsonb,
  alter column theme set not null;
