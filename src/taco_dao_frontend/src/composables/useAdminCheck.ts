import { ref } from 'vue'
import { Actor, HttpAgent } from '@dfinity/agent'
import { AuthClient } from '@dfinity/auth-client'
import { useTacoStore } from '../stores/taco.store'

/**
 * Composable for checking if the current user has admin permissions
 */
export function useAdminCheck() {
  const tacoStore = useTacoStore()
  const isAdmin = ref(false)
  const checking = ref(false)
  
  /**
   * Check if the current user has admin permissions
   * Uses hasAdminPermission from the DAO backend
   */
  const checkAdminStatus = async (): Promise<boolean> => {
    checking.value = true
    
    try {
      // Get auth client and identity
      const authClient = await AuthClient.create()
      const identity = authClient.getIdentity()
      
      // Create agent
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
      
      return isAdmin.value
    } catch (error) {
      console.error('Error checking admin status:', error)
      isAdmin.value = false
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

