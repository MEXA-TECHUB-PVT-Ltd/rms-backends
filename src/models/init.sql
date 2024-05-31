CREATE TABLE IF NOT EXISTS currency (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ccy VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);