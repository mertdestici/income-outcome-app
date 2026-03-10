-- Make expense_id nullable to support document-first upload (upload before expense exists)
ALTER TABLE documents ALTER COLUMN expense_id DROP NOT NULL;

-- OCR pipeline fields
ALTER TABLE documents
    ADD COLUMN ocr_status   VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
    ADD COLUMN ocr_vendor   VARCHAR(255),
    ADD COLUMN ocr_date     DATE,
    ADD COLUMN ocr_amount   NUMERIC(19, 4);

CREATE INDEX idx_documents_ocr_status ON documents (ocr_status)
    WHERE ocr_status IN ('PENDING', 'PROCESSING');
