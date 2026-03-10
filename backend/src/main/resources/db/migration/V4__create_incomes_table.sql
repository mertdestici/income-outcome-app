CREATE TABLE incomes (
    id         UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      VARCHAR(255)   NOT NULL,
    amount     NUMERIC(19,4)  NOT NULL,
    currency   VARCHAR(3)     NOT NULL,
    created_at TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_incomes_user_id    ON incomes (user_id);
CREATE INDEX idx_incomes_currency   ON incomes (user_id, currency);
CREATE INDEX idx_incomes_created_at ON incomes (user_id, created_at);
