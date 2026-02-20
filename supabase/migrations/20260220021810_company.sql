create table public.company (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  user_id uuid not null,
  resume_id uuid null,
  company text not null,
  company_logo text null,
  position text not null,
  location text not null,
  salary text null,
  job_url text null,
  status text not null default 'saved'::text,
  stage_details jsonb not null default '[]'::jsonb,
  interview_sub_stages jsonb null default '[]'::jsonb,
  constraint company_pkey primary key (id),
  constraint company_resume_id_fkey foreign KEY (resume_id) references resume_config (resume_id) on delete set null,
  constraint company_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint company_status_check check (
    (
      status = any (
        array[
          'saved'::text,
          'applied'::text,
          'screen'::text,
          'interview'::text,
          'offer'::text,
          'rejected'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;
