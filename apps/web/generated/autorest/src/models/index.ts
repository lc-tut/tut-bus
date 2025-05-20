import * as coreClient from "@azure/core-client";

export interface ModelsBusStop {
  id: number;
  name: string;
  lat?: number;
  lon?: number;
}

/** HTTP 404 Not Found - The requested resource does not exist. */
export interface PathsDyok9LApiBusStopsIdGetResponses404ContentApplicationJsonSchema {
  code: "NotFound";
  message: "BusStopNotFound";
  details?: "The requested bus stop does not exist.";
}

export interface ModelsBusStopTimetable {
  id: number;
  name: string;
  lat: number;
  lon: number;
  date: Date;
  segments: ModelsBusStopSegment[];
}

/** HTTP 404 Not Found - The requested resource does not exist. */
export interface Paths1255ZxxApiBusStopsIdTimetablesGetResponses404ContentApplicationJsonSchema {
  code: "NotFound";
  message: "BusStopNotFound";
  details?: "The requested bus stop does not exist.";
}

/** HTTP 409 Conflict - The request conflicts with the current state of the server. */
export interface ErrorsConflict {
  code: "Conflict";
  message: string;
}

/** Validation error for a single field. */
export interface ErrorsFieldError {
  field: string;
  message: string;
}

/** HTTP 403 Forbidden - You do not have permission to access this resource. */
export interface ErrorsForbidden {
  code: "Forbidden";
  message: string;
}

/** HTTP 500 Internal Server Error - Unexpected condition on the server. */
export interface ErrorsInternalServerError {
  code: "InternalServerError";
  message: string;
  details?: string;
}

/** HTTP 401 Unauthorized - Authentication is required or has failed. */
export interface ErrorsUnauthorized {
  code: "Unauthorized";
  message: string;
}

/** HTTP 422 Unprocessable Entity - Validation failed on submitted data. */
export interface ErrorsValidationError {
  code: "ValidationError";
  message: string;
  fieldErrors?: ErrorsFieldError[];
}

export interface ModelsFixedSegment {
  segmentType: "fixed";
  destination: ModelsStopRef;
  times: ModelsTimePair[];
}

export interface ModelsStopRef {
  stopId: number;
  stopName: string;
  lat?: number;
  lon?: number;
}

export interface ModelsTimePair {
  arrival: string;
  departure: string;
}

export interface ModelsFrequencySegment {
  segmentType: "frequency";
  destination: ModelsStopRef;
  startTime: string;
  endTime: string;
  intervalMins: number;
}

export interface ModelsShuttleSegment {
  segmentType: "shuttle";
  destination: ModelsStopRef;
  startTime: string;
  endTime: string;
  intervalRange: ModelsShuttleSegmentIntervalRange;
}

export interface ModelsShuttleSegmentIntervalRange {
  min: number;
  max: number;
}

/** Known values of {@link ModelsBusStopSegment} that the service accepts. */
export enum KnownModelsBusStopSegment {
  /** FixedSegment */
  FixedSegment = "FixedSegment",
  /** FrequencySegment */
  FrequencySegment = "FrequencySegment",
  /** ShuttleSegment */
  ShuttleSegment = "ShuttleSegment",
}

/**
 * Defines values for ModelsBusStopSegment. \
 * {@link KnownModelsBusStopSegment} can be used interchangeably with ModelsBusStopSegment,
 *  this enum contains the known values that the service supports.
 * ### Known values supported by the service
 * **FixedSegment** \
 * **FrequencySegment** \
 * **ShuttleSegment**
 */
export type ModelsBusStopSegment = string;

/** Known values of {@link RoutesTimetableBadRequest} that the service accepts. */
export enum KnownRoutesTimetableBadRequest {
  /** InvalidDateBadRequest */
  InvalidDateBadRequest = "InvalidDateBadRequest",
  /** InvalidRangeBadRequest */
  InvalidRangeBadRequest = "InvalidRangeBadRequest",
  /** RangeTooLongBadRequest */
  RangeTooLongBadRequest = "RangeTooLongBadRequest",
  /** DateRangeExclusiveBadRequest */
  DateRangeExclusiveBadRequest = "DateRangeExclusiveBadRequest",
  /** FromAfterToBadRequest */
  FromAfterToBadRequest = "FromAfterToBadRequest",
}

/**
 * Defines values for RoutesTimetableBadRequest. \
 * {@link KnownRoutesTimetableBadRequest} can be used interchangeably with RoutesTimetableBadRequest,
 *  this enum contains the known values that the service supports.
 * ### Known values supported by the service
 * **InvalidDateBadRequest** \
 * **InvalidRangeBadRequest** \
 * **RangeTooLongBadRequest** \
 * **DateRangeExclusiveBadRequest** \
 * **FromAfterToBadRequest**
 */
export type RoutesTimetableBadRequest = string;

/** Known values of {@link ErrorsServiceError} that the service accepts. */
export enum KnownErrorsServiceError {
  /** BadRequest */
  BadRequest = "BadRequest",
  /** Unauthorized */
  Unauthorized = "Unauthorized",
  /** Forbidden */
  Forbidden = "Forbidden",
  /** NotFound */
  NotFound = "NotFound",
  /** Conflict */
  Conflict = "Conflict",
  /** ValidationError */
  ValidationError = "ValidationError",
  /** InternalServerError */
  InternalServerError = "InternalServerError",
}

/**
 * Defines values for ErrorsServiceError. \
 * {@link KnownErrorsServiceError} can be used interchangeably with ErrorsServiceError,
 *  this enum contains the known values that the service supports.
 * ### Known values supported by the service
 * **BadRequest** \
 * **Unauthorized** \
 * **Forbidden** \
 * **NotFound** \
 * **Conflict** \
 * **ValidationError** \
 * **InternalServerError**
 */
export type ErrorsServiceError = string;

/** Optional parameters. */
export interface BusStopsGetAllBusStopsOptionalParams
  extends coreClient.OperationOptions {}

/** Contains response data for the getAllBusStops operation. */
export type BusStopsGetAllBusStopsResponse = ModelsBusStop[];

/** Optional parameters. */
export interface BusStopsGetBusStopDetailsOptionalParams
  extends coreClient.OperationOptions {}

/** Contains response data for the getBusStopDetails operation. */
export type BusStopsGetBusStopDetailsResponse = ModelsBusStop;

/** Optional parameters. */
export interface BusStopsGetBusStopTimetableOptionalParams
  extends coreClient.OperationOptions {}

/** Contains response data for the getBusStopTimetable operation. */
export type BusStopsGetBusStopTimetableResponse = ModelsBusStopTimetable[];

/** Optional parameters. */
export interface TokyoUniversityOfTechnologyBusWebAPIServiceOptionalParams
  extends coreClient.ServiceClientOptions {
  /** Overrides client endpoint. */
  endpoint?: string;
}
