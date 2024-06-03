CREATE TABLE IF NOT EXISTS currency (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ccy VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(50),
    unit VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_category (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50), 
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);