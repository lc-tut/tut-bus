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

/** Interface representing a Widgets. */
export interface Widgets {
  /**
   * List widgets
   * @param options The options parameters.
   */
  list(options?: WidgetsListOptionalParams): Promise<WidgetsListResponse>
  /**
   * Create a widget
   * @param body
   * @param options The options parameters.
   */
  create(body: Widget, options?: WidgetsCreateOptionalParams): Promise<WidgetsCreateResponse>
  /**
   * Read widgets
   * @param id
   * @param options The options parameters.
   */
  read(id: string, options?: WidgetsReadOptionalParams): Promise<WidgetsReadResponse>
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
  ): Promise<WidgetsUpdateResponse>
  /**
   * Delete a widget
   * @param id
   * @param options The options parameters.
   */
  delete(id: string, options?: WidgetsDeleteOptionalParams): Promise<void>
  /**
   * Analyze a widget
   * @param id
   * @param options The options parameters.
   */
  analyze(id: string, options?: WidgetsAnalyzeOptionalParams): Promise<WidgetsAnalyzeResponse>
}
