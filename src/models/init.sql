CREATE TABLE
    IF NOT EXISTS currency (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        ccy VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW (),
        updated_at TIMESTAMP DEFAULT NOW ()
    );

CREATE TABLE
    IF NOT EXISTS payment_term (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        payment_term_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW (),
        updated_at TIMESTAMP DEFAULT NOW ()
    );

CREATE TABLE
    IF NOT EXISTS vendor (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        v_type VARCHAR(255) NOT NULL CHECK (v_type IN ('SUPPLIER', 'STORE')),
        provider_type VARCHAR(255) NOT NULL CHECK (provider_type IN ('SERVICE', 'PRODUCTS')),
        first_name VARCHAR(255) DEFAULT NULL,
        last_name VARCHAR(255) DEFAULT NULL,
        company_name VARCHAR(255) DEFAULT NULL,
        vendor_display_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone_no VARCHAR(255) NOT NULL,
        work_no VARCHAR(255) DEFAULT NULL,
        country VARCHAR(255) DEFAULT NULL,
        address VARCHAR(255) NOT NULL,
        city VARCHAR(255) DEFAULT NULL,
        state VARCHAR(255) DEFAULT NULL,
        zip_code VARCHAR(255) DEFAULT NULL,
        fax_number VARCHAR(255) DEFAULT NULL,
        shipping_address VARCHAR(255) DEFAULT NULL,
        currency_id UUID REFERENCES currency (id) ON DELETE CASCADE,
        payment_term_id UUID REFERENCES payment_term (id) ON DELETE CASCADE,
        document JSONB DEFAULT NULL,
        contact_person JSONB DEFAULT NULL,
        created_at TIMESTAMP DEFAULT NOW (),
        updated_at TIMESTAMP DEFAULT NOW ()
    );

CREATE TABLE
    IF NOT EXISTS units (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        category VARCHAR(50),
        unit VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW (),
        updated_at TIMESTAMP DEFAULT NOW ()
    );

CREATE TABLE
    IF NOT EXISTS product_category (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        name VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW (),
        updated_at TIMESTAMP DEFAULT NOW ()
    );

CREATE TABLE
    IF NOT EXISTS item (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        type VARCHAR(50) CHECK (type IN ('PRODUCT', 'SERVICE')),
        name VARCHAR(255),
        product_category UUID REFERENCES product_category (id),
        product_units UUID REFERENCES units (id),
        usage_unit UUID REFERENCES units (id),
        product_catalog VARCHAR(50) CHECK (product_catalog IN ('CONSUMER', 'ASSETS')),
        description VARCHAR(50),
        stock_in_hand INT NOT NULL,
        opening_stock_rate INT NOT NULL,
        reorder_unit INT NOT NULL,
        inventory_description VARCHAR(50),
        image VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW (),
        updated_at TIMESTAMP DEFAULT NOW ()
    );

CREATE TABLE
    IF NOT EXISTS item_preferred_vendor (
        item_id UUID REFERENCES item (id),
        vendor_id UUID REFERENCES vendor (id),
        PRIMARY KEY (item_id, vendor_id)
    );

CREATE TABLE
    IF NOT EXISTS category (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        item_id UUID REFERENCES item (id) ON DELETE CASCADE,
        available_stock NUMERIC NOT NULL,
        required_quantity NUMERIC NOT NULL,
        price NUMERIC NOT NULL,
        preffered_vendor_ids TEXT[] NOT NULL,
        category_name VARCHAR(50), 
        created_at TIMESTAMP DEFAULT NOW (),
        updated_at TIMESTAMP DEFAULT NOW ()
    );

    CREATE TABLE
    IF NOT EXISTS recipes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        recipe_name VARCHAR(50), 
        category UUID REFERENCES category(id),
        difficulty_level VARCHAR(50) CHECK (difficulty_level IN ('HIGH', 'MEDIUM', 'LOW')),
        added_by VARCHAR(50),
        price INT,
        cooking_time INT,
        selected_item UUID REFERENCES item(id),
        nutritional_info VARCHAR(50),
        allergen_info VARCHAR(50),
        presentation_instructions VARCHAR(50),
        equipment_needed VARCHAR(50),
        side_order VARCHAR(50),
        image VARCHAR(50),
        preparation_instructions VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );