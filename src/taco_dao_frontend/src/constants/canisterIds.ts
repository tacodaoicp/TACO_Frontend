export type EnvKey = 'ic' | 'staging'

export type CanisterKey =
  | 'dao_backend'
  | 'neuronSnapshot'
  | 'treasury'
  | 'validation'
  | 'trading_archive'
  | 'portfolio_archive'
  | 'price_archive'
  | 'dao_admin_archive'
  | 'dao_governance_archive'
  | 'dao_allocation_archive'
  | 'rewards'
  | 'dao_neuron_allocation_archive'
  | 'reward_distribution_archive'
  | 'reward_withdrawal_archive'
  | 'frontend'

export const CANISTER_IDS: Record<CanisterKey, Record<EnvKey, string>> = {
  // Main
  dao_backend: {
    ic: 'vxqw7-iqaaa-aaaan-qzziq-cai',
    staging: 'tisou-7aaaa-aaaai-atiea-cai',
  },
  neuronSnapshot: {
    ic: 'vzs3x-taaaa-aaaan-qzzjq-cai',
    staging: 'tgqd4-eqaaa-aaaai-atifa-cai',
  },
  treasury: {
    ic: 'v6t5d-6yaaa-aaaan-qzzja-cai',
    staging: 'tptia-syaaa-aaaai-atieq-cai',
  },
  rewards: {
    ic: 'dkgdg-saaaa-aaaan-qz5ma-cai',
    staging: 'cjkka-gyaaa-aaaan-qz5kq-cai',
  },
  validation: {
    ic: 'th44n-iyaaa-aaaan-qzz5a-cai',
    staging: 'tbrfi-jiaaa-aaaai-atifq-cai',
  },

  // Archives
  trading_archive: {
    ic: 'jmze3-hiaaa-aaaan-qz4xq-cai',
    staging: 'jlycp-kqaaa-aaaan-qz4xa-cai',
  },
  portfolio_archive: {
    ic: 'bl7x7-wiaaa-aaaan-qz5bq-cai',
    staging: 'lrekt-uaaaa-aaaan-qz4ya-cai',
  },
  price_archive: {
    ic: 'bm6rl-3qaaa-aaaan-qz5ba-cai',
    staging: 'l7gh3-pqaaa-aaaan-qz4za-cai',
  },
  dao_admin_archive: {
    ic: 'cspwf-4aaaa-aaaan-qz5ia-cai',
    staging: 'b6ygs-xaaaa-aaaan-qz5ca-cai',
  },
  dao_governance_archive: {
    ic: 'c4n3n-hqaaa-aaaan-qz5ja-cai',
    staging: 'bzzag-2yaaa-aaaan-qz5cq-cai',
  },
  dao_allocation_archive: {
    ic: 'cvoqr-ryaaa-aaaan-qz5iq-cai',
    staging: 'bq2l2-mqaaa-aaaan-qz5da-cai',
  },
  dao_neuron_allocation_archive: {
    ic: 'dnhfs-7yaaa-aaaan-qz5mq-cai',
    staging: 'cajb4-qqaaa-aaaan-qz5la-cai',
  },
  reward_distribution_archive: {
    ic: 'uqkap-jiaaa-aaaan-qz6tq-cai',
    staging: 'ddfi2-eiaaa-aaaan-qz5nq-cai',
  },
  reward_withdrawal_archive: {
    ic: 'v5eeb-gaaaa-aaaan-qz6ua-cai',
    staging: 'dwczx-faaaa-aaaan-qz5oa-cai',
  },

  // Frontend
  frontend: {
    ic: 'lx7ws-diaaa-aaaag-aubda-cai',
    staging: 'wxunf-maaaa-aaaab-qbzga-cai',
  },
}


