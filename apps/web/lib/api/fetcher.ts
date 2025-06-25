import { client } from '@/lib/client'
import type { paths } from '@/generated/oas'

/**
 * SWR 用 fetcher。エンドポイント文字列を受け取り
 * client.GET() の data を返す (error は throw)。
 */
export const fetcher = async <T>(url: string): Promise<T> => {
  /*
   * openapi-fetch が生成する client.GET は
   *   client.GET<Res, Opts>(path, opts)
   * の 2 引数シグネチャ（rest パラメータ `init` が必須）
   * そのため **空オブジェクトでも良いので第 2 引数を渡す** 必要がある。
   */
  // NOTE: 動的ルートの場合は `url` にクエリ文字列を含めれば OK。

  const { data, error } = await client.GET(url as keyof paths, {} as never)
  if (error) throw error
  return data as T
}
