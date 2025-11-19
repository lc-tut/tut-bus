DROP TABLE IF EXISTS bus_stops_group;
ALTER TABLE bus_stops DROP CONSTRAINT IF EXISTS fk_bus_stops_group;
ALTER TABLE bus_stops DROP COLUMN IF EXISTS group_id;
