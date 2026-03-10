ALTER TABLE incomes
    ADD COLUMN recurrence_rule VARCHAR(20) NOT NULL DEFAULT 'NONE',
    ADD COLUMN next_occurrence  DATE;

ALTER TABLE expenses
    ADD COLUMN recurrence_rule VARCHAR(20) NOT NULL DEFAULT 'NONE',
    ADD COLUMN next_occurrence  DATE;

CREATE INDEX idx_incomes_next_occurrence  ON incomes  (next_occurrence) WHERE next_occurrence IS NOT NULL;
CREATE INDEX idx_expenses_next_occurrence ON expenses (next_occurrence) WHERE next_occurrence IS NOT NULL;
