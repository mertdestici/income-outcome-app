CREATE TABLE audit_log (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES users(id),
    entity_type VARCHAR(50)  NOT NULL,
    entity_id   UUID         NOT NULL,
    action      VARCHAR(20)  NOT NULL,
    payload     JSONB,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_user_id   ON audit_log (user_id, created_at DESC);
CREATE INDEX idx_audit_entity_id ON audit_log (entity_id);
