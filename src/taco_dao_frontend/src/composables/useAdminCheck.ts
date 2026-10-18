import { ref } from 'vue'
import { useTacoStore } from '../stores/taco.store'
import { setAdminStatus } from '../stores/worker-bridge'
import { ADMIN_PRINCIPALS } from '../constants/adminPrincipals'

// The list lives with the constants so the data worker can use it too
export { ADMIN_PRINCIPALS } from '../constants/adminPrincipals'

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
      // Check if user is logged in first
      if (!tacoStore.userLoggedIn) {
        isAdmin.value = false
        setAdminStatus(false)
        return false
      }

      // Get user principal from store
      const principalText = tacoStore.userPrincipal

      // Check hardcoded admin list first (faster)
      if (principalText && ADMIN_PRINCIPALS.includes(principalText)) {
        isAdmin.value = true
        setAdminStatus(true)
        return true
      }

      // If we already checked the backend, return cached result
      if (backendCheckDone) {
        return isAdmin.value
      }

      // Use store's getAuthenticatedAgent for proper identity management
      const { Actor } = await import('@dfinity/agent')
      const agent = await tacoStore.getAuthenticatedAgent()

      // Import DAO IDL and create actor
      const { idlFactory: daoIDL } = await import('../../../declarations/dao_backend/DAO_backend.did.js')
      const daoActor = Actor.createActor(daoIDL, {
        agent,
        canisterId: tacoStore.daoBackendCanisterId()
      }) as any

      // Get principal from agent and check permission
      const principal = await agent.getPrincipal()
      isAdmin.value = await daoActor.hasAdminPermission(principal, { getLogs: null })
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

