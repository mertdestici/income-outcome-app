CREATE TABLE expenses (
    id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title         VARCHAR(255)   NOT NULL,
    amount        NUMERIC(19,4)  NOT NULL,
    currency      VARCHAR(3)     NOT NULL,
    date          DATE           NOT NULL,
    document_type VARCHAR(20),
    created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_expenses_user_id       ON expenses (user_id);
CREATE INDEX idx_expenses_date          ON expenses (user_id, date);
CREATE INDEX idx_expenses_currency      ON expenses (user_id, currency);
CREATE INDEX idx_expenses_document_type ON expenses (user_id, document_type);
