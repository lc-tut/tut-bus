import * as coreClient from "@azure/core-client";

export const ModelsBusStop: coreClient.CompositeMapper = {
  type: {
    name: "Composite",
    className: "ModelsBusStop",
    modelProperties: {
      id: {
        serializedName: "id",
        required: true,
        type: {
          name: "Number",
        },
      },
      name: {
        serializedName: "name",
        required: true,
        type: {
          name: "String",
        },
      },
      lat: {
        constraints: {
          InclusiveMaximum: 90,
          InclusiveMinimum: -90,
        },
        serializedName: "lat",
        type: {
          name: "Number",
        },
      },
      lon: {
        constraints: {
          InclusiveMaximum: 180,
          InclusiveMinimum: -180,
        },
        serializedName: "lon",
        type: {
          name: "Number",
        },
      },
    },
  },
};

export const PathsDyok9LApiBusStopsIdGetResponses404ContentApplicationJsonSchema: coreClient.CompositeMapper =
  {
    type: {
      name: "Composite",
      className:
        "PathsDyok9LApiBusStopsIdGetResponses404ContentApplicationJsonSchema",
      modelProperties: {
        code: {
          defaultValue: "NotFound",
          isConstant: true,
          serializedName: "code",
          type: {
            name: "String",
          },
        },
        message: {
          defaultValue: "BusStopNotFound",
          isConstant: true,
          serializedName: "message",
          type: {
            name: "String",
          },
        },
        details: {
          defaultValue: "The requested bus stop does not exist.",
          isConstant: true,
          serializedName: "details",
          type: {
            name: "String",
          },
        },
      },
    },
  };

export const ModelsBusStopTimetable: coreClient.CompositeMapper = {
  type: {
    name: "Composite",
    className: "ModelsBusStopTimetable",
    modelProperties: {
      id: {
        serializedName: "id",
        required: true,
        type: {
          name: "Number",
        },
      },
      name: {
        serializedName: "name",
        required: true,
        type: {
          name: "String",
        },
      },
      lat: {
        constraints: {
          InclusiveMaximum: 90,
          InclusiveMinimum: -90,
        },
        serializedName: "lat",
        required: true,
        type: {
          name: "Number",
        },
      },
      lon: {
        constraints: {
          InclusiveMaximum: 180,
          InclusiveMinimum: -180,
        },
        serializedName: "lon",
        required: true,
        type: {
          name: "Number",
        },
      },
      date: {
        serializedName: "date",
        required: true,
        type: {
          name: "Date",
        },
      },
      segments: {
        serializedName: "segments",
        required: true,
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "String",
            },
          },
        },
      },
    },
  },
};

export const Paths1255ZxxApiBusStopsIdTimetablesGetResponses404ContentApplicationJsonSchema: coreClient.CompositeMapper =
  {
    type: {
      name: "Composite",
      className:
        "Paths1255ZxxApiBusStopsIdTimetablesGetResponses404ContentApplicationJsonSchema",
      modelProperties: {
        code: {
          defaultValue: "NotFound",
          isConstant: true,
          serializedName: "code",
          type: {
            name: "String",
          },
        },
        message: {
          defaultValue: "BusStopNotFound",
          isConstant: true,
          serializedName: "message",
          type: {
            name: "String",
          },
        },
        details: {
          defaultValue: "The requested bus stop does not exist.",
          isConstant: true,
          serializedName: "details",
          type: {
            name: "String",
          },
        },
      },
    },
  };

export const ErrorsConflict: coreClient.CompositeMapper = {
  type: {
    name: "Composite",
    className: "ErrorsConflict",
    modelProperties: {
      code: {
        defaultValue: "Conflict",
        isConstant: true,
        serializedName: "code",
        type: {
          name: "String",
        },
      },
      message: {
        serializedName: "message",
        required: true,
        type: {
          name: "String",
        },
      },
    },
  },
};

export const ErrorsFieldError: coreClient.CompositeMapper = {
  type: {
    name: "Composite",
    className: "ErrorsFieldError",
    modelProperties: {
      field: {
        serializedName: "field",
        required: true,
        type: {
          name: "String",
        },
      },
      message: {
        serializedName: "message",
        required: true,
        type: {
          name: "String",
        },
      },
    },
  },
};

export const ErrorsForbidden: coreClient.CompositeMapper = {
  type: {
    name: "Composite",
    className: "ErrorsForbidden",
    modelProperties: {
      code: {
        defaultValue: "Forbidden",
        isConstant: true,
        serializedName: "code",
        type: {
          name: "String",
        },
      },
      message: {
        serializedName: "message",
        required: true,
        type: {
          name: "String",
        },
      },
    },
  },
};

export const ErrorsInternalServerError: coreClient.CompositeMapper = {
  type: {
    name: "Composite",
    className: "ErrorsInternalServerError",
    modelProperties: {
      code: {
        defaultValue: "InternalServerError",
        isConstant: true,
        serializedName: "code",
        type: {
          name: "String",
        },
      },
      message: {
        serializedName: "message",
        required: true,
        type: {
          name: "String",
        },
      },
      details: {
        serializedName: "details",
        type: {
          name: "String",
        },
      },
    },
  },
};

export const ErrorsUnauthorized: coreClient.CompositeMapper = {
  type: {
    name: "Composite",
    className: "ErrorsUnauthorized",
    modelProperties: {
      code: {
        defaultValue: "Unauthorized",
        isConstant: true,
        serializedName: "code",
        type: {
          name: "String",
        },
      },
      message: {
        serializedName: "message",
        required: true,
        type: {
          name: "String",
        },
      },
    },
  },
};

export const ErrorsValidationError: coreClient.CompositeMapper = {
  type: {
    name: "Composite",
    className: "ErrorsValidationError",
    modelProperties: {
      code: {
        defaultValue: "ValidationError",
        isConstant: true,
        serializedName: "code",
        type: {
          name: "String",
        },
      },
      message: {
        serializedName: "message",
        required: true,
        type: {
          name: "String",
        },
      },
      fieldErrors: {
        serializedName: "fieldErrors",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "ErrorsFieldError",
            },
          },
        },
      },
    },
  },
};

export const ModelsFixedSegment: coreClient.CompositeMapper = {
  type: {
    name: "Composite",
    className: "ModelsFixedSegment",
    modelProperties: {
      segmentType: {
        defaultValue: "fixed",
        isConstant: true,
        serializedName: "segmentType",
        type: {
          name: "String",
        },
      },
      destination: {
        serializedName: "destination",
        type: {
          name: "Composite",
          className: "ModelsStopRef",
        },
      },
      times: {
        serializedName: "times",
        required: true,
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "ModelsTimePair",
            },
          },
        },
      },
    },
  },
};

export const ModelsStopRef: coreClient.CompositeMapper = {
  type: {
    name: "Composite",
    className: "ModelsStopRef",
    modelProperties: {
      stopId: {
        serializedName: "stopId",
        required: true,
        type: {
          name: "Number",
        },
      },
      stopName: {
        serializedName: "stopName",
        required: true,
        type: {
          name: "String",
        },
      },
      lat: {
        constraints: {
          InclusiveMaximum: 90,
          InclusiveMinimum: -90,
        },
        serializedName: "lat",
        type: {
          name: "Number",
        },
      },
      lon: {
        constraints: {
          InclusiveMaximum: 180,
          InclusiveMinimum: -180,
        },
        serializedName: "lon",
        type: {
          name: "Number",
        },
      },
    },
  },
};

export const ModelsTimePair: coreClient.CompositeMapper = {
  type: {
    name: "Composite",
    className: "ModelsTimePair",
    modelProperties: {
      arrival: {
        constraints: {
          Pattern: new RegExp("^(?:[01]\\d|2[0-3]):[0-5]\\d$"),
        },
        serializedName: "arrival",
        required: true,
        type: {
          name: "String",
        },
      },
      departure: {
        constraints: {
          Pattern: new RegExp("^(?:[01]\\d|2[0-3]):[0-5]\\d$"),
        },
        serializedName: "departure",
        required: true,
        type: {
          name: "String",
        },
      },
    },
  },
};

export const ModelsFrequencySegment: coreClient.CompositeMapper = {
  type: {
    name: "Composite",
    className: "ModelsFrequencySegment",
    modelProperties: {
      segmentType: {
        defaultValue: "frequency",
        isConstant: true,
        serializedName: "segmentType",
        type: {
          name: "String",
        },
      },
      destination: {
        serializedName: "destination",
        type: {
          name: "Composite",
          className: "ModelsStopRef",
        },
      },
      startTime: {
        constraints: {
          Pattern: new RegExp("^(?:[01]\\d|2[0-3]):[0-5]\\d$"),
        },
        serializedName: "startTime",
        required: true,
        type: {
          name: "String",
        },
      },
      endTime: {
        constraints: {
          Pattern: new RegExp("^(?:[01]\\d|2[0-3]):[0-5]\\d$"),
        },
        serializedName: "endTime",
        required: true,
        type: {
          name: "String",
        },
      },
      intervalMins: {
        serializedName: "intervalMins",
        required: true,
        type: {
          name: "Number",
        },
      },
    },
  },
};

export const ModelsShuttleSegment: coreClient.CompositeMapper = {
  type: {
    name: "Composite",
    className: "ModelsShuttleSegment",
    modelProperties: {
      segmentType: {
        defaultValue: "shuttle",
        isConstant: true,
        serializedName: "segmentType",
        type: {
          name: "String",
        },
      },
      destination: {
        serializedName: "destination",
        type: {
          name: "Composite",
          className: "ModelsStopRef",
        },
      },
      startTime: {
        constraints: {
          Pattern: new RegExp("^(?:[01]\\d|2[0-3]):[0-5]\\d$"),
        },
        serializedName: "startTime",
        required: true,
        type: {
          name: "String",
        },
      },
      endTime: {
        constraints: {
          Pattern: new RegExp("^(?:[01]\\d|2[0-3]):[0-5]\\d$"),
        },
        serializedName: "endTime",
        required: true,
        type: {
          name: "String",
        },
      },
      intervalRange: {
        serializedName: "intervalRange",
        type: {
          name: "Composite",
          className: "ModelsShuttleSegmentIntervalRange",
        },
      },
    },
  },
};

export const ModelsShuttleSegmentIntervalRange: coreClient.CompositeMapper = {
  type: {
    name: "Composite",
    className: "ModelsShuttleSegmentIntervalRange",
    modelProperties: {
      min: {
        serializedName: "min",
        required: true,
        type: {
          name: "Number",
        },
      },
      max: {
        serializedName: "max",
        required: true,
        type: {
          name: "Number",
        },
      },
    },
  },
};
