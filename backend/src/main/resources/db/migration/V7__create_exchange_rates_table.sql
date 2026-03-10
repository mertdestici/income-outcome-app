CREATE TABLE exchange_rates (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    base_currency   VARCHAR(3)    NOT NULL,
    target_currency VARCHAR(3)    NOT NULL,
    rate            NUMERIC(19,6) NOT NULL,
    fetched_at      TIMESTAMPTZ   NOT NULL,
    UNIQUE (base_currency, target_currency)
);
CREATE INDEX idx_exchange_rates_pair ON exchange_rates (base_currency, target_currency);
