namespace BusAPI.Errors;

@doc("HTTP 400 Bad Request - The request cannot be processed due to client error.")
@error
model BadRequest<MessageT extends string = string, DetailT extends string = string> {
  code: "BadRequest";
  message: MessageT;
  detail: DetailT;
}

@doc("HTTP 401 Unauthorized - Authentication is required or has failed.")
@error
model Unauthorized {
  code: "Unauthorized";
  message: string;
}

@doc("HTTP 403 Forbidden - You do not have permission to access this resource.")
@error
model Forbidden {
  code: "Forbidden";
  message: string;
}
@doc("HTTP 404 Not Found - The requested resource does not exist.")
@error
model NotFound<MessageT extends string = string, DetailsT extends string = string> {
  code: "NotFound";
  message: MessageT;
  details?: DetailsT;
}

@doc("HTTP 409 Conflict - The request conflicts with the current state of the server.")
@error
model Conflict {
  code: "Conflict";
  message: string;
}

@doc("Validation error for a single field.")
model FieldError {
  field: string;
  message: string;
}

@doc("HTTP 422 Unprocessable Entity - Validation failed on submitted data.")
@error
model ValidationError {
  code: "ValidationError";
  message: string;
  fieldErrors?: FieldError[];
}

@doc("HTTP 500 Internal Server Error - Unexpected condition on the server.")
@error
model InternalServerError {
  code: "InternalServerError";
  message: string;
  details?: string;
}

@TypeSpec.OpenAPI.oneOf
union ServiceError {
  BadRequest,
  Unauthorized,
  Forbidden,
  NotFound,
  Conflict,
  ValidationError,
  InternalServerError
}
