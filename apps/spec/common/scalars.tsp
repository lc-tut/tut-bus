namespace BusAPI.Scalars;

@format("date")
scalar DateISO extends string;

@pattern("^(?:[01]\\d|2[0-3]):[0-5]\\d$")
scalar TimeISO extends string;

@minValue(-90)
@maxValue(90)
scalar Latitude extends float;

@minValue(-180)
@maxValue(180)
scalar Longitude extends float;
