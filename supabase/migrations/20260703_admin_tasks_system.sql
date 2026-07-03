-- Admin Tasks System
-- Separate from patient-level tasks; scoped to admin users and optionally an org

CREATE TABLE IF NOT EXISTS admin_tasks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  description     text,
  status          text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done')),
  priority        text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  -- source context (optional)
  source_type     text CHECK (source_type IN ('email','agenda','manual')),
  source_id       text,  -- email id or calendar event id
  -- assignee is an admin_user by email (no FK to avoid cross-schema issues)
  assignee_email  text,
  assignee_name   text,
  created_by_email text,
  created_by_name  text,
  due_date        date,
  completed_at    timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_task_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     uuid NOT NULL REFERENCES admin_tasks(id) ON DELETE CASCADE,
  author_email text NOT NULL,
  author_name  text,
  body        text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- Mentions: one row per @mention inside a comment
CREATE TABLE IF NOT EXISTS admin_task_mentions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id         uuid NOT NULL REFERENCES admin_tasks(id) ON DELETE CASCADE,
  comment_id      uuid NOT NULL REFERENCES admin_task_comments(id) ON DELETE CASCADE,
  mentioned_email text NOT NULL,
  mentioned_name  text,
  read_at         timestamptz,
  created_at      timestamptz DEFAULT now()
);

-- Notifications: task assigned to me or I was mentioned
CREATE TABLE IF NOT EXISTS admin_task_notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  type            text NOT NULL CHECK (type IN ('assigned','mentioned','comment')),
  task_id         uuid NOT NULL REFERENCES admin_tasks(id) ON DELETE CASCADE,
  comment_id      uuid REFERENCES admin_task_comments(id) ON DELETE CASCADE,
  actor_email     text,
  actor_name      text,
  read_at         timestamptz,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_tasks_org ON admin_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_assignee ON admin_tasks(assignee_email);
CREATE INDEX IF NOT EXISTS idx_admin_task_comments_task ON admin_task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_admin_task_mentions_email ON admin_task_mentions(mentioned_email);
CREATE INDEX IF NOT EXISTS idx_admin_task_notifications_recipient ON admin_task_notifications(recipient_email, read_at);
