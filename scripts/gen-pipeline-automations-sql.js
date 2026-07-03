/**
 * Generates a single, paste-once SQL file for the Supabase SQL editor that:
 *   1. Creates the Phase 4 tables (from the migration file)
 *   2. Seeds the "Aliice — All-in-one Platform" email template (/template design)
 *   3. Creates one active send_email automation per funnel stage (for testing)
 *
 * The whole thing is idempotent and safe to run more than once.
 *
 * Usage:  node scripts/gen-pipeline-automations-sql.js
 * Output: scripts/manual-pipeline-automations.sql
 */

const fs = require("fs");
const path = require("path");
const {
  buildEmailHtml,
  TEMPLATE_NAME,
  TEMPLATE_SUBJECT,
  MIGRATION_PATH,
} = require("./setup-pipeline-automations");

const OUT_PATH = path.join(__dirname, "manual-pipeline-automations.sql");

const migrationSql = fs.readFileSync(MIGRATION_PATH, "utf-8");
const bodyHtml = buildEmailHtml("{{org.name}}");

const STAGE_AUTOMATIONS = [
  ["Welcome email — New Signup", "new_signup"],
  ["Follow-up — Contacted", "contacted"],
  ["Demo confirmation — Demo Scheduled", "demo_scheduled"],
  ["Onboarding kickoff — Onboarding", "onboarding"],
  ["Welcome aboard — Active Client", "active"],
  ["Win-back — Churned", "churned"],
];

const stageValues = STAGE_AUTOMATIONS.map(
  ([name, stage]) => `    ('${name.replace(/'/g, "''")}', '${stage}')`
).join(",\n");

const sql = `-- ============================================================
-- Phase 4: Sales Pipeline Automations — one-shot setup
-- Paste this entire file into the Supabase SQL editor and Run.
-- Safe to run more than once (idempotent).
-- ============================================================

${migrationSql}

-- ------------------------------------------------------------
-- Seed the /template welcome email + one automation per stage
-- ------------------------------------------------------------
DO $seed$
DECLARE
  tpl_id uuid;
BEGIN
  SELECT id INTO tpl_id
  FROM sales_pipeline_email_templates
  WHERE name = '${TEMPLATE_NAME.replace(/'/g, "''")}'
  LIMIT 1;

  IF tpl_id IS NULL THEN
    INSERT INTO sales_pipeline_email_templates (name, subject, body_html, description)
    VALUES (
      '${TEMPLATE_NAME.replace(/'/g, "''")}',
      '${TEMPLATE_SUBJECT.replace(/'/g, "''")}',
      $body$${bodyHtml}$body$,
      'Marketing welcome email served at /template. Personalized via {{org.name}}.'
    )
    RETURNING id INTO tpl_id;
  ELSE
    UPDATE sales_pipeline_email_templates
    SET subject = '${TEMPLATE_SUBJECT.replace(/'/g, "''")}',
        body_html = $body$${bodyHtml}$body$,
        updated_at = NOW()
    WHERE id = tpl_id;
  END IF;

  -- Create one automation per stage, only where one doesn't already exist.
  INSERT INTO sales_pipeline_automations (name, trigger_stage, action_type, template_id, active)
  SELECT v.name, v.stage, 'send_email', tpl_id, true
  FROM (VALUES
${stageValues}
  ) AS v(name, stage)
  WHERE NOT EXISTS (
    SELECT 1 FROM sales_pipeline_automations a WHERE a.trigger_stage = v.stage
  );
END
$seed$;

-- Verify
SELECT 'templates' AS kind, count(*) FROM sales_pipeline_email_templates
UNION ALL
SELECT 'automations', count(*) FROM sales_pipeline_automations;
`;

fs.writeFileSync(OUT_PATH, sql, "utf-8");
console.log("✓ Wrote", OUT_PATH);
console.log("  Bytes:", sql.length);
console.log("  Automations seeded:", STAGE_AUTOMATIONS.length);
