import { ref } from 'vue'
import { useTacoStore } from '../stores/taco.store'
import { setAdminStatus } from '../stores/worker-bridge'

// Lazy-load heavy @dfinity modules to reduce initial bundle size
let _agentModule: typeof import('@dfinity/agent') | null = null
let _authClientModule: typeof import('@dfinity/auth-client') | null = null

async function getAgentModule() {
  if (!_agentModule) {
    _agentModule = await import('@dfinity/agent')
  }
  return _agentModule
}

async function getAuthClientModule() {
  if (!_authClientModule) {
    _authClientModule = await import('@dfinity/auth-client')
  }
  return _authClientModule
}

/**
 * Hardcoded list of admin principals
 * These principals have admin access without needing backend verification
 */
const ADMIN_PRINCIPALS = [
  'odoge-dr36c-i3lls-orjen-eapnp-now2f-dj63m-3bdcd-nztox-5gvzy-sqe',
  'cspwf-4aaaa-aaaan-qz5ia-cai',
  'tisou-7aaaa-aaaai-atiea-cai',
  'tgqd4-eqaaa-aaaai-atifa-cai',
  'tptia-syaaa-aaaai-atieq-cai',
  'tbrfi-jiaaa-aaaai-atifq-cai',
  'jlycp-kqaaa-aaaan-qz4xa-cai',
  'lrekt-uaaaa-aaaan-qz4ya-cai',
  'l7gh3-pqaaa-aaaan-qz4za-cai',
  'b6ygs-xaaaa-aaaan-qz5ca-cai',
  'bzzag-2yaaa-aaaan-qz5cq-cai',
  'bq2l2-mqaaa-aaaan-qz5da-cai',
  'cjkka-gyaaa-aaaan-qz5kq-cai',
  'cajb4-qqaaa-aaaan-qz5la-cai',
  'vxqw7-iqaaa-aaaan-qzziq-cai',
  'vzs3x-taaaa-aaaan-qzzjq-cai',
  'v6t5d-6yaaa-aaaan-qzzja-cai',
  'th44n-iyaaa-aaaan-qzz5a-cai',
  'jmze3-hiaaa-aaaan-qz4xq-cai',
  'bl7x7-wiaaa-aaaan-qz5bq-cai',
  'bm6rl-3qaaa-aaaan-qz5ba-cai',
  'c4n3n-hqaaa-aaaan-qz5ja-cai',
  'cvoqr-ryaaa-aaaan-qz5iq-cai',
  'dkgdg-saaaa-aaaan-qz5ma-cai',
  'dnhfs-7yaaa-aaaan-qz5mq-cai',
  'uuyso-zydjd-tsb4o-lgpgj-dfsvq-awald-j2zfp-e6h72-d2je3-whmjr-xae',
  '6mxg4-njnu6-qzizq-2ekit-rnagc-4d42s-qyayx-jghoe-nd72w-elbsy-xqe',
  'yjdlk-jqx52-ha6xa-w6iqe-b4jrr-s5ova-mirv4-crlfi-xgsaa-ib3cg-3ae',
  'chxs6-z6h3t-hjrgk-i5x57-rm7fm-3tvlz-b352m-heq2g-hu23b-sxasf-kqe',
  '6q3ra-pds56-nqzzc-itigw-tsw4r-vs235-yqx5u-dg34n-nnsus-kkpqf-aqe',
  'd7zib-qo5mr-qzmpb-dtyof-l7yiu-pu52k-wk7ng-cbm3n-ffmys-crbkz-nae',
  'as6jn-gaoo7-k4kji-tdkxg-jlsrk-avxkc-zu76j-vz7hj-di3su-2f74z-qqe',
  'r27hb-ckxon-xohqv-afcvx-yhemm-xoggl-37dg6-sfyt3-n6jer-ditge-6qe',
  '5uvsz-em754-ulbgb-vxihq-wqyzd-brdgs-snzlu-mhlqw-k74uu-4l5h3-2qe',
  'k2xol-5avzc-lf3wt-vwoft-pjx6k-77fjh-7pera-6b7qt-fwt5e-a3ekl-vqe',
  'hxjcv-hbraf-oathz-repfu-x7szv-j6p2f-2cu6n-fywhf-yxago-plyz5-5ae',
  '4ggui-2celt-yxv2h-z6zyh-sq5ok-rycog-tjyfl-gzxsj-kiq3y-c4sm4-lqe',
  'hzeez-ilt5k-pzrtz-hdcg3-pwjq5-564tv-uu46m-esqun-chj7o-uptsv-aae',
  'nfzo4-i26mj-e2tuj-bt3ba-cuco4-vcqxx-ybjw7-gzyzh-kvyp7-wjeyp-hqe',
]

/**
 * Composable for checking if the current user has admin permissions
 */
export function useAdminCheck() {
  const tacoStore = useTacoStore()
  const isAdmin = ref(false)
  const checking = ref(false)
  let backendCheckDone = false // Track if we've already done the backend check

  /**
   * Check if the current user has admin permissions
   * First checks hardcoded list, then falls back to backend verification (only once)
   */
  const checkAdminStatus = async (): Promise<boolean> => {
    checking.value = true

    try {
      // Lazy-load auth client module
      const { AuthClient } = await getAuthClientModule()

      // Get auth client and identity
      const authClient = await AuthClient.create()
      const identity = authClient.getIdentity()
      const principalText = identity.getPrincipal().toText()

      // Check hardcoded admin list first (faster)
      if (ADMIN_PRINCIPALS.includes(principalText)) {
        isAdmin.value = true
        setAdminStatus(true)
        return true
      }

      // If we already checked the backend, return cached result
      if (backendCheckDone) {
        return isAdmin.value
      }

      // Lazy-load agent module
      const { Actor, HttpAgent } = await getAgentModule()

      // Fall back to backend verification (only once)
      const agent = new HttpAgent({
        identity,
        host: process.env.DFX_NETWORK === "local" ? "http://localhost:4943" : "https://ic0.app"
      })

      if (process.env.DFX_NETWORK === 'local') {
        await agent.fetchRootKey()
      }

      // Import DAO IDL and create actor
      const { idlFactory: daoIDL } = await import('../../../declarations/dao_backend/DAO_backend.did.js')
      const daoActor = Actor.createActor(daoIDL, {
        agent,
        canisterId: tacoStore.daoBackendCanisterId()
      }) as any

      // Check permission for a read-safe function like getLogs
      isAdmin.value = await daoActor.hasAdminPermission(identity.getPrincipal(), { getLogs: null })
      setAdminStatus(isAdmin.value)
      backendCheckDone = true // Mark that we've done the backend check

      return isAdmin.value
    } catch (error) {
      console.error('Error checking admin status:', error)
      isAdmin.value = false
      setAdminStatus(false)
      backendCheckDone = true // Don't retry on error
      return false
    } finally {
      checking.value = false
    }
  }
  
  return {
    isAdmin,
    checking,
    checkAdminStatus
  }
}

