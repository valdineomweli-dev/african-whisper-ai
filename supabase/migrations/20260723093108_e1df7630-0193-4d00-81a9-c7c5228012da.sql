ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_token TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_device TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_connected BOOLEAN NOT NULL DEFAULT false;