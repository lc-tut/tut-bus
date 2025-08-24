-- name: GetBusStop :one
SELECT * FROM bus_stops WHERE id = $1;

-- name: ListBusStops :many
SELECT * FROM bus_stops ORDER BY name;

-- name: CreateBusStop :one
INSERT INTO bus_stops (name, lat, lng)
VALUES ($1, $2, $3)
RETURNING *;

-- name: UpdateBusStop :exec
UPDATE bus_stops 
SET name = $2, lat = $3, lng = $4
WHERE id = $1;

-- name: DeleteBusStop :exec
DELETE FROM bus_stops WHERE id = $1;
