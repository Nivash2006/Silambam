-- Create students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    age INTEGER,
    phone TEXT,
    parent_phone TEXT,
    address TEXT,
    joining_date DATE DEFAULT CURRENT_DATE,
    belt_level TEXT DEFAULT 'White',
    fee_amount INTEGER DEFAULT 0,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL, -- 'present', 'absent'
    class_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, date)
);

-- Create fees table
CREATE TABLE fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    month TEXT NOT NULL, -- e.g., 'March 2024'
    amount INTEGER NOT NULL,
    payment_date DATE,
    method TEXT, -- 'online', 'cash'
    status TEXT DEFAULT 'pending', -- 'paid', 'pending'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tournaments table
CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    date DATE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    position TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create belt_promotions table
CREATE TABLE belt_promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    previous_level TEXT,
    new_level TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
-- For now, authenticated users can do everything
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE belt_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated access to students" ON students FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access to attendance" ON attendance FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access to fees" ON fees FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access to tournaments" ON tournaments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access to belt_promotions" ON belt_promotions FOR ALL USING (auth.role() = 'authenticated');
