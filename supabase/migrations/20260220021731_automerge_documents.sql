create table public.automerge_documents (
  id uuid not null default extensions.uuid_generate_v4 (),
  resume_id uuid not null,
  user_id uuid not null,
  document_data bytea not null,
  heads text[] not null,
  document_version integer not null default 1,
  change_count integer not null default 0,
  metadata jsonb null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint automerge_documents_pkey primary key (id),
  constraint automerge_documents_resume_id_key unique (resume_id),
  constraint automerge_documents_resume_id_fkey foreign KEY (resume_id) references resume_config (resume_id) on delete CASCADE,
  constraint automerge_documents_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_automerge_docs_user on public.automerge_documents using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_automerge_docs_resume on public.automerge_documents using btree (resume_id) TABLESPACE pg_default;

create index IF not exists idx_automerge_docs_updated on public.automerge_documents using btree (updated_at desc) TABLESPACE pg_default;

create trigger update_automerge_docs_updated_at BEFORE
update on automerge_documents for EACH row
execute FUNCTION update_updated_at_column ();
