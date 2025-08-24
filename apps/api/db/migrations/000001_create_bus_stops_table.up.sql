CREATE TABLE bus_stops (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bus_stops_name ON bus_stops(name);
