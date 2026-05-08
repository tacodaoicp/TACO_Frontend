import type { Ref } from 'vue'
import type { KlineData, TimeFrame } from 'declarations/OTC_backend/OTC_backend.did.d.ts'

export type { KlineData, TimeFrame }

export interface KlineDatafeed {
  getRange(
    token0: string,
    token1: string,
    timeframe: TimeFrame,
    before: [] | [bigint],
    limit: bigint,
  ): Promise<KlineData[]>

  getLatest(
    token0: string,
    token1: string,
    timeframe: TimeFrame,
    initialGet: boolean,
  ): Promise<KlineData[]>

  isInverted(token0: string, token1: string): boolean

  livePrice?: Ref<number>
}
