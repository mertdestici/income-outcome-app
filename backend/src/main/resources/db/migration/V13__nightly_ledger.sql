-- Nightly Ledger: card / category / note on expenses, per-user card & category
-- lists, explicit "nothing spent" days, and reminder preferences.

ALTER TABLE expenses ADD COLUMN card     VARCHAR(50);
ALTER TABLE expenses ADD COLUMN category VARCHAR(50);
ALTER TABLE expenses ADD COLUMN note     VARCHAR(500);

-- Cards and categories are stored as plain names on expenses, so removing an
-- option from this list never touches expenses already logged against it.
CREATE TABLE ledger_options (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind       VARCHAR(20)  NOT NULL,
    name       VARCHAR(50)  NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_ledger_options UNIQUE (user_id, kind, name)
);
CREATE INDEX idx_ledger_options_user ON ledger_options (user_id, kind);

CREATE TABLE no_spend_days (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date       DATE         NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_no_spend_days UNIQUE (user_id, date)
);

ALTER TABLE users ADD COLUMN timezone               VARCHAR(64) NOT NULL DEFAULT 'Europe/Istanbul';
ALTER TABLE users ADD COLUMN daily_reminder_enabled BOOLEAN     NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN monthly_ledger_enabled BOOLEAN     NOT NULL DEFAULT FALSE;
