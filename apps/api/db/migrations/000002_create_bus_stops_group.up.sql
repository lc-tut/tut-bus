CREATE TABLE IF NOT EXISTS bus_stops_group (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bus_stops_group_name ON bus_stops_group(name);

ALTER TABLE bus_stops ADD COLUMN IF NOT EXISTS group_id INTEGER;
ALTER TABLE bus_stops ADD CONSTRAINT fk_bus_stops_group FOREIGN KEY (group_id) REFERENCES bus_stops_group(id);
