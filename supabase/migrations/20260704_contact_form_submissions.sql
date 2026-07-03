-- Contact form submissions table
CREATE TABLE IF NOT EXISTS contact_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_form_submissions_created_at_idx ON contact_form_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS contact_form_submissions_email_idx ON contact_form_submissions(email);
