import * as coreClient from "@azure/core-client";

export interface WidgetList {
  items: Widget[];
}

export interface Widget {
  id: string;
  weight: number;
  color: WidgetColor;
}

export interface ErrorModel {
  code: number;
  message: string;
}

export interface WidgetMergePatchUpdate {
  id?: string;
  weight?: number;
  color?: WidgetMergePatchUpdateColor;
}

export interface AnalyzeResult {
  id: string;
  analysis: string;
}

/** Known values of {@link WidgetColor} that the service accepts. */
export enum KnownWidgetColor {
  /** Red */
  Red = "red",
  /** Blue */
  Blue = "blue",
}

/**
 * Defines values for WidgetColor. \
 * {@link KnownWidgetColor} can be used interchangeably with WidgetColor,
 *  this enum contains the known values that the service supports.
 * ### Known values supported by the service
 * **red** \
 * **blue**
 */
export type WidgetColor = string;

/** Known values of {@link WidgetMergePatchUpdateColor} that the service accepts. */
export enum KnownWidgetMergePatchUpdateColor {
  /** Red */
  Red = "red",
  /** Blue */
  Blue = "blue",
}

/**
 * Defines values for WidgetMergePatchUpdateColor. \
 * {@link KnownWidgetMergePatchUpdateColor} can be used interchangeably with WidgetMergePatchUpdateColor,
 *  this enum contains the known values that the service supports.
 * ### Known values supported by the service
 * **red** \
 * **blue**
 */
export type WidgetMergePatchUpdateColor = string;

/** Optional parameters. */
export interface WidgetsListOptionalParams
  extends coreClient.OperationOptions {}

/** Contains response data for the list operation. */
export type WidgetsListResponse = WidgetList;

/** Optional parameters. */
export interface WidgetsCreateOptionalParams
  extends coreClient.OperationOptions {}

/** Contains response data for the create operation. */
export type WidgetsCreateResponse = Widget;

/** Optional parameters. */
export interface WidgetsReadOptionalParams
  extends coreClient.OperationOptions {}

/** Contains response data for the read operation. */
export type WidgetsReadResponse = Widget;

/** Optional parameters. */
export interface WidgetsUpdateOptionalParams
  extends coreClient.OperationOptions {}

/** Contains response data for the update operation. */
export type WidgetsUpdateResponse = Widget;

/** Optional parameters. */
export interface WidgetsDeleteOptionalParams
  extends coreClient.OperationOptions {}

/** Optional parameters. */
export interface WidgetsAnalyzeOptionalParams
  extends coreClient.OperationOptions {}

/** Contains response data for the analyze operation. */
export type WidgetsAnalyzeResponse = AnalyzeResult;

/** Optional parameters. */
export interface WidgetServiceOptionalParams
  extends coreClient.ServiceClientOptions {
  /** Overrides client endpoint. */
  endpoint?: string;
}
