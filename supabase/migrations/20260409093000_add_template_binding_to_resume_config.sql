alter table public.resume_config
  add column if not exists template_binding jsonb;

alter table public.resume_config
  drop constraint if exists resume_config_template_binding_is_object_check;

alter table public.resume_config
  add constraint resume_config_template_binding_is_object_check
  check (
    template_binding is null
    or jsonb_typeof(template_binding) = 'object'
  );
