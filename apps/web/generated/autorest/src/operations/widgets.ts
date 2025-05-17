import { Widgets } from '../operationsInterfaces/index.js'
import * as coreClient from '@azure/core-client'
import * as Mappers from '../models/mappers.js'
import * as Parameters from '../models/parameters.js'
import { WidgetService } from '../widgetService.js'
import {
  WidgetsListOptionalParams,
  WidgetsListResponse,
  Widget,
  WidgetsCreateOptionalParams,
  WidgetsCreateResponse,
  WidgetsReadOptionalParams,
  WidgetsReadResponse,
  WidgetMergePatchUpdate,
  WidgetsUpdateOptionalParams,
  WidgetsUpdateResponse,
  WidgetsDeleteOptionalParams,
  WidgetsAnalyzeOptionalParams,
  WidgetsAnalyzeResponse,
} from '../models/index.js'

/** Class containing Widgets operations. */
export class WidgetsImpl implements Widgets {
  private readonly client: WidgetService

  /**
   * Initialize a new instance of the class Widgets class.
   * @param client Reference to the service client
   */
  constructor(client: WidgetService) {
    this.client = client
  }

  /**
   * List widgets
   * @param options The options parameters.
   */
  list(options?: WidgetsListOptionalParams): Promise<WidgetsListResponse> {
    return this.client.sendOperationRequest({ options }, listOperationSpec)
  }

  /**
   * Create a widget
   * @param body
   * @param options The options parameters.
   */
  create(body: Widget, options?: WidgetsCreateOptionalParams): Promise<WidgetsCreateResponse> {
    return this.client.sendOperationRequest({ body, options }, createOperationSpec)
  }

  /**
   * Read widgets
   * @param id
   * @param options The options parameters.
   */
  read(id: string, options?: WidgetsReadOptionalParams): Promise<WidgetsReadResponse> {
    return this.client.sendOperationRequest({ id, options }, readOperationSpec)
  }

  /**
   * Update a widget
   * @param id
   * @param body
   * @param options The options parameters.
   */
  update(
    id: string,
    body: WidgetMergePatchUpdate,
    options?: WidgetsUpdateOptionalParams
  ): Promise<WidgetsUpdateResponse> {
    return this.client.sendOperationRequest({ id, body, options }, updateOperationSpec)
  }

  /**
   * Delete a widget
   * @param id
   * @param options The options parameters.
   */
  delete(id: string, options?: WidgetsDeleteOptionalParams): Promise<void> {
    return this.client.sendOperationRequest({ id, options }, deleteOperationSpec)
  }

  /**
   * Analyze a widget
   * @param id
   * @param options The options parameters.
   */
  analyze(id: string, options?: WidgetsAnalyzeOptionalParams): Promise<WidgetsAnalyzeResponse> {
    return this.client.sendOperationRequest({ id, options }, analyzeOperationSpec)
  }
}
// Operation Specifications
const serializer = coreClient.createSerializer(Mappers, /* isXml */ false)

const listOperationSpec: coreClient.OperationSpec = {
  path: '/widgets',
  httpMethod: 'GET',
  responses: {
    200: {
      bodyMapper: Mappers.WidgetList,
    },
    default: {
      bodyMapper: Mappers.ErrorModel,
    },
  },
  urlParameters: [Parameters.$host],
  headerParameters: [Parameters.accept],
  serializer,
}
const createOperationSpec: coreClient.OperationSpec = {
  path: '/widgets',
  httpMethod: 'POST',
  responses: {
    200: {
      bodyMapper: Mappers.Widget,
    },
    default: {
      bodyMapper: Mappers.ErrorModel,
    },
  },
  requestBody: Parameters.body,
  urlParameters: [Parameters.$host],
  headerParameters: [Parameters.accept, Parameters.contentType],
  mediaType: 'json',
  serializer,
}
const readOperationSpec: coreClient.OperationSpec = {
  path: '/widgets/{id}',
  httpMethod: 'GET',
  responses: {
    200: {
      bodyMapper: Mappers.Widget,
    },
    default: {
      bodyMapper: Mappers.ErrorModel,
    },
  },
  urlParameters: [Parameters.$host, Parameters.id],
  headerParameters: [Parameters.accept],
  serializer,
}
const updateOperationSpec: coreClient.OperationSpec = {
  path: '/widgets/{id}',
  httpMethod: 'PATCH',
  responses: {
    200: {
      bodyMapper: Mappers.Widget,
    },
    default: {
      bodyMapper: Mappers.ErrorModel,
    },
  },
  requestBody: Parameters.body1,
  urlParameters: [Parameters.$host, Parameters.id],
  headerParameters: [Parameters.accept, Parameters.contentType1],
  mediaType: 'json',
  serializer,
}
const deleteOperationSpec: coreClient.OperationSpec = {
  path: '/widgets/{id}',
  httpMethod: 'DELETE',
  responses: {
    204: {},
    default: {
      bodyMapper: Mappers.ErrorModel,
    },
  },
  urlParameters: [Parameters.$host, Parameters.id],
  headerParameters: [Parameters.accept],
  serializer,
}
const analyzeOperationSpec: coreClient.OperationSpec = {
  path: '/widgets/{id}/analyze',
  httpMethod: 'POST',
  responses: {
    200: {
      bodyMapper: Mappers.AnalyzeResult,
    },
    default: {
      bodyMapper: Mappers.ErrorModel,
    },
  },
  urlParameters: [Parameters.$host, Parameters.id],
  headerParameters: [Parameters.accept],
  serializer,
}
