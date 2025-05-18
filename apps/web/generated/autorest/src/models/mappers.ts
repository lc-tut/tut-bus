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
        serializedName: "lat",
        required: true,
        type: {
          name: "Number",
        },
      },
      lon: {
        serializedName: "lon",
        required: true,
        type: {
          name: "Number",
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
      busStopId: {
        serializedName: "busStopId",
        required: true,
        type: {
          name: "Number",
        },
      },
    },
  },
};
