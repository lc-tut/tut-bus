import * as coreClient from "@azure/core-client";

export const WidgetList: coreClient.CompositeMapper = {
  type: {
    name: "Composite",
    className: "WidgetList",
    modelProperties: {
      items: {
        serializedName: "items",
        required: true,
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "Widget",
            },
          },
        },
      },
    },
  },
};

export const Widget: coreClient.CompositeMapper = {
  type: {
    name: "Composite",
    className: "Widget",
    modelProperties: {
      id: {
        serializedName: "id",
        required: true,
        type: {
          name: "String",
        },
      },
      weight: {
        serializedName: "weight",
        required: true,
        type: {
          name: "Number",
        },
      },
      color: {
        serializedName: "color",
        required: true,
        type: {
          name: "String",
        },
      },
    },
  },
};

export const ErrorModel: coreClient.CompositeMapper = {
  type: {
    name: "Composite",
    className: "ErrorModel",
    modelProperties: {
      code: {
        serializedName: "code",
        required: true,
        type: {
          name: "Number",
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

export const WidgetMergePatchUpdate: coreClient.CompositeMapper = {
  type: {
    name: "Composite",
    className: "WidgetMergePatchUpdate",
    modelProperties: {
      id: {
        serializedName: "id",
        type: {
          name: "String",
        },
      },
      weight: {
        serializedName: "weight",
        type: {
          name: "Number",
        },
      },
      color: {
        serializedName: "color",
        type: {
          name: "String",
        },
      },
    },
  },
};

export const AnalyzeResult: coreClient.CompositeMapper = {
  type: {
    name: "Composite",
    className: "AnalyzeResult",
    modelProperties: {
      id: {
        serializedName: "id",
        required: true,
        type: {
          name: "String",
        },
      },
      analysis: {
        serializedName: "analysis",
        required: true,
        type: {
          name: "String",
        },
      },
    },
  },
};
