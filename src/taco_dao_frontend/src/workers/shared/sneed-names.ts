/**
 * Sneed naming service (sneed_pid_names, sneed_neuron_names): every public name, read from the
 * canisters' changes feeds. A full read from the start returns each account, canister name and
 * neuron name once, in its current state, so a few calls give the same maps as the old
 * app_sneeddao_backend get_all_principal_names / get_all_neuron_names.
 *
 * Used by the names worker and by the store.
 */
import type { _SERVICE as PidNamesService } from '../../../../declarations/sneed_pid_names/sneed_pid_names.did.js'
import type { _SERVICE as NeuronNamesService } from '../../../../declarations/sneed_neuron_names/sneed_neuron_names.did.js'

export type NameEntry = { name: string; verified: boolean }

const PAGE = 500n

const toHex = (arr: Uint8Array | number[]): string =>
  Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('')

/** The key the frontend uses for a neuron name: `<sns root>:<neuron id hex>`. */
export const neuronNameKey = (snsRoot: { toString: () => string }, neuronId: Uint8Array | number[]): string =>
  `${snsRoot.toString()}:${toHex(neuronId)}`

/** principal text -> name. Every principal of a named account shows the account's name. */
export async function fetchPrincipalNames(actor: PidNamesService): Promise<Map<string, NameEntry>> {
  const out = new Map<string, NameEntry>()
  let after = 0n
  for (;;) {
    const page = await actor.changes_since({ after, limit: PAGE })
    if (page.items.length === 0) break
    for (const c of page.items) {
      const state = c.state[0]
      if (!state) continue // deleted
      if ('account' in state) {
        const name = state.account.name[0]
        if (!name) continue // an account with only an avatar
        for (const m of state.account.members) out.set(m.principal.toText(), { name, verified: state.account.verified })
      } else {
        out.set(state.canister.canister.toText(), { name: state.canister.name, verified: state.canister.verified })
      }
    }
    after = page.items[page.items.length - 1]!.seq
  }
  return out
}

/** `<sns root>:<neuron id hex>` -> name, for every SNS. */
export async function fetchNeuronNames(actor: NeuronNamesService): Promise<Map<string, NameEntry>> {
  const out = new Map<string, NameEntry>()
  let after = 0n
  for (;;) {
    const page = await actor.changes_since({ after, limit: PAGE })
    if (page.items.length === 0) break
    for (const c of page.items) {
      const n = c.state[0]
      if (!n) continue // removed
      out.set(neuronNameKey(n.sns_root, n.neuron_id as Uint8Array | number[]), { name: n.name, verified: n.verified })
    }
    after = page.items[page.items.length - 1]!.seq
  }
  return out
}
