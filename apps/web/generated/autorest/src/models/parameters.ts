import {
  OperationParameter,
  OperationURLParameter,
  OperationQueryParameter,
} from "@azure/core-client";

export const accept: OperationParameter = {
  parameterPath: "accept",
  mapper: {
    defaultValue: "application/json",
    isConstant: true,
    serializedName: "Accept",
    type: {
      name: "String",
    },
  },
};

export const $host: OperationURLParameter = {
  parameterPath: "$host",
  mapper: {
    serializedName: "$host",
    required: true,
    type: {
      name: "String",
    },
  },
  skipEncoding: true,
};

export const id: OperationURLParameter = {
  parameterPath: "id",
  mapper: {
    serializedName: "id",
    required: true,
    type: {
      name: "Number",
    },
  },
};

export const dateParam: OperationQueryParameter = {
  parameterPath: "dateParam",
  mapper: {
    serializedName: "date",
    required: true,
    type: {
      name: "Date",
    },
  },
};

export const fromParam: OperationQueryParameter = {
  parameterPath: "fromParam",
  mapper: {
    serializedName: "from",
    required: true,
    type: {
      name: "Date",
    },
  },
};

export const to: OperationQueryParameter = {
  parameterPath: "to",
  mapper: {
    serializedName: "to",
    required: true,
    type: {
      name: "Date",
    },
  },
};
