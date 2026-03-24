<template>
  <div class="standard-view">
    <div class="scroll-y-container h-100">
      <div class="container p-0">
        <div class="row h-100 d-flex flex-column flex-nowrap overflow-hidden px-2 px-sm-0">

          <TacoTitle level="h2" emoji="" title="Frontend Identity Test" class="mt-4" />

          <div class="taco-container taco-container--l1 mt-3 p-4">
            <h5 class="mb-3">Embedded Identity</h5>

            <div v-if="loading" class="text-muted">
              <i class="fa fa-spinner fa-spin me-2"></i>Loading identity...
            </div>

            <div v-else>
              <div class="mb-3">
                <strong>Principal:</strong>
                <code class="ms-2 user-select-all">{{ principal }}</code>
              </div>

              <button @click="testQuery" class="btn btn-primary" :disabled="querying">
                <span v-if="querying">
                  <i class="fa fa-spinner fa-spin me-2"></i>Querying...
                </span>
                <span v-else>
                  <i class="fa fa-bolt me-2"></i>Test Canister Query
                </span>
              </button>

              <div v-if="queryResult !== null" class="mt-3">
                <div :class="['alert', querySuccess ? 'alert-success' : 'alert-danger']">
                  <strong>{{ querySuccess ? 'Success' : 'Error' }}:</strong>
                  {{ queryResult }}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getFrontendIdentity } from '../utils/frontend-identity'
import { getNetworkHost, shouldFetchRootKey } from '../shared/auth-cache'
import TacoTitle from '../components/misc/TacoTitle.vue'

export default {
  name: 'FrontendIdentityTestView',
  components: { TacoTitle },
  data() {
    return {
      principal: '',
      loading: true,
      querying: false,
      queryResult: null,
      querySuccess: false,
    }
  },
  async mounted() {
    try {
      const identity = getFrontendIdentity()
      this.principal = identity.getPrincipal().toText()
    } catch (e) {
      this.principal = `Error: ${e.message}`
    }
    this.loading = false
  },
  methods: {
    async testQuery() {
      this.querying = true
      this.queryResult = null
      try {
        const { createAgent } = await import('@dfinity/utils')
        const identity = getFrontendIdentity()
        const host = getNetworkHost()
        const agent = await createAgent({
          identity,
          host,
          fetchRootKey: shouldFetchRootKey(),
        })

        // Simple agent status check - proves the identity works with IC
        const status = await agent.status()
        this.querySuccess = true
        this.queryResult = `Agent connected. IC root key length: ${status?.root_key?.length ?? 'N/A'} bytes. Replica version: ${status?.replica_health_status ?? 'unknown'}`
      } catch (e) {
        this.querySuccess = false
        this.queryResult = e.message
      }
      this.querying = false
    },
  },
}
</script>
