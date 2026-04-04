-- Supabase Migration: Initial Schema
-- Run this in your Supabase project's SQL Editor (https://supabase.com/dashboard)

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id         BIGSERIAL PRIMARY KEY,
  name       VARCHAR(120)  NOT NULL,
  email      VARCHAR(150)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_makeBot BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Bot commands table
CREATE TABLE IF NOT EXISTS public.bot_commands (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  command    VARCHAR(255)  NOT NULL,
  response   TEXT          NOT NULL,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_command UNIQUE (user_id, command)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bot_commands_user_id ON public.bot_commands(user_id);

-- Row Level Security: disable for server-side service role access
-- (The app uses the service role key, so RLS is bypassed automatically)
-- If you want RLS, enable it and add appropriate policies.
