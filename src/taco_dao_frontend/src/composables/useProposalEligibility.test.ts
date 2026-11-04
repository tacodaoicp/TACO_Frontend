import { describe, it, expect, vi, beforeEach } from 'vitest'

const ME = 'me-principal'
const store = {
  userLoggedIn: true,
  userPrincipal: ME,
  getTacoNeurons: vi.fn(),
  getProposalRequirements: vi.fn(),
}
vi.mock('../stores/taco.store', () => ({ useTacoStore: () => store }))

import { useProposalEligibility } from './useProposalEligibility'

const TACO = 100_000_000n
const WEEK = 604_800n
const nowS = () => BigInt(Math.floor(Date.now() / 1000))

const neuron = (o: { perms?: number[]; who?: string; stake?: bigint; fees?: bigint; state?: any[] } = {}) => ({
  id: [{ id: new Uint8Array([1]) }],
  permissions: [{ principal: [{ toText: () => o.who ?? ME }], permission_type: o.perms ?? [3, 4] }],
  cached_neuron_stake_e8s: o.stake ?? 77n * TACO,
  neuron_fees_e8s: o.fees ?? 0n,
  dissolve_state: o.state ?? [{ DissolveDelaySeconds: WEEK }],
})

async function check(...neurons: any[]) {
  store.getTacoNeurons.mockResolvedValue(neurons)
  const e = useProposalEligibility()
  const res = await e.checkEligibility()
  return { e, res }
}

beforeEach(() => {
  store.userLoggedIn = true
  store.getProposalRequirements.mockReset()
  store.getProposalRequirements.mockResolvedValue({ rejectCostE8s: 77n * TACO, minDissolveDelaySeconds: WEEK })
})

describe('useProposalEligibility', () => {
  it('passes a neuron that meets every requirement, exactly at the limits', async () => {
    const { res } = await check(neuron())
    expect(res.isEligible).toBe(true)
    expect(res.eligibleNeurons[0].meetsRequirements).toBe(true)
  })

  it('needs SubmitProposal (3), and Vote (4) alone is not enough', async () => {
    expect((await check(neuron({ perms: [4] }))).res.hasProposalPermission).toBe(false)
    expect((await check(neuron({ perms: [3] }))).res.hasProposalPermission).toBe(true)
  })

  it('looks only at the permissions of the logged in principal', async () => {
    expect((await check(neuron({ who: 'someone-else' }))).res.hasProposalPermission).toBe(false)
  })

  it('needs the live reject cost, not a fixed number', async () => {
    expect((await check(neuron({ stake: 77n * TACO - 1n }))).res.isEligible).toBe(false)
    store.getProposalRequirements.mockResolvedValue({ rejectCostE8s: 7n * TACO, minDissolveDelaySeconds: WEEK })
    expect((await check(neuron({ stake: 7n * TACO }))).res.isEligible).toBe(true)
  })

  it('takes fees off the stake', async () => {
    expect((await check(neuron({ stake: 77n * TACO, fees: 1n }))).res.isEligible).toBe(false)
    expect((await check(neuron({ stake: 78n * TACO, fees: TACO }))).res.isEligible).toBe(true)
  })

  it('needs the minimum dissolve delay', async () => {
    expect((await check(neuron({ state: [{ DissolveDelaySeconds: WEEK - 1n }] }))).res.isEligible).toBe(false)
    expect((await check(neuron({ state: [] }))).res.isEligible).toBe(false)
  })

  it('counts what is left of a dissolving neuron', async () => {
    const until = (s: bigint) => [{ WhenDissolvedTimestampSeconds: nowS() + s }]
    expect((await check(neuron({ state: until(WEEK + 60n) }))).res.isEligible).toBe(true)
    expect((await check(neuron({ state: until(WEEK - 60n) }))).res.isEligible).toBe(false)
    expect((await check(neuron({ state: until(-60n) }))).res.isEligible).toBe(false)
  })

  it('needs one neuron to meet both, not one each', async () => {
    const { res } = await check(neuron({ stake: TACO }), neuron({ state: [] }))
    expect(res.isEligible).toBe(false)
  })

  it('offers only the neurons that qualify', async () => {
    const { res } = await check(neuron({ stake: TACO }), neuron())
    expect(res.isEligible).toBe(true)
    expect(res.eligibleNeurons.map(n => n.meetsRequirements)).toEqual([false, true])
  })

  it('shows the live numbers', async () => {
    const { e } = await check(neuron())
    expect(e.requirementText.value).toBe('a neuron with at least 77 TACO and a dissolve delay of at least 7 days')
    expect(e.rejectCostText.value).toBe('77 TACO is deducted if rejected')
  })

  it('is not eligible when the requirements cannot be read', async () => {
    store.getProposalRequirements.mockRejectedValue(new Error('down'))
    const { e, res } = await check(neuron())
    expect(res.isEligible).toBe(false)
    expect(res.error).toBe('down')
    expect(e.rejectCostText.value).toBe('')
    expect(e.requirementText.value).not.toMatch(/\d/)
  })

  it('stops at the login check', async () => {
    store.userLoggedIn = false
    const { res } = await check(neuron())
    expect(res.isLoggedIn).toBe(false)
    expect(res.isEligible).toBe(false)
  })
})
