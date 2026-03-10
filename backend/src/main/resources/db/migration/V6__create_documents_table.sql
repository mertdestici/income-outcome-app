CREATE TABLE documents (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id   UUID         NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name    VARCHAR(255) NOT NULL,
    file_path    TEXT         NOT NULL,
    content_type VARCHAR(127) NOT NULL,
    size_bytes   BIGINT       NOT NULL,
    uploaded_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_documents_expense_id ON documents (expense_id);
CREATE INDEX idx_documents_user_id    ON documents (user_id);
