<template>

  <div class="standard-view">

    <!-- scroll container -->
    <div class="scroll-y-container h-100">

      <!-- bootstrap container -->
      <div class="container p-0">

        <!-- bootstrap row -->
        <div class="row h-100 d-flex flex-column flex-nowrap overflow-hidden px-2 px-sm-0">

          <!-- buy taco page -->
          <div class="buy-taco-view">

            <!-- title -->
            <div class="buy-taco-view__page-header">
              <TacoTitle level="h2" :emoji="selectedProduct === 'nachos' ? '🧀' : '🌮'" :title="selectedProduct === 'nachos' ? 'Fund & Mint' : 'Fund & Swap'" forceTextColor="var(--gold)" />
            </div>

            <!-- system paused banner -->
            <div v-if="systemPaused" class="buy-taco-view__paused-banner">
              <i class="fa-solid fa-triangle-exclamation me-2"></i>
              System is currently paused for maintenance. Swaps may be delayed.
            </div>

            <!-- how it works - horizontal timeline -->
            <div class="buy-taco-view__info w-100">
              <h3 class="buy-taco-view__section-title">How it works</h3>
              <div class="buy-taco-view__timeline">
                <div class="buy-taco-view__timeline-step">
                  <span class="buy-taco-view__step-num">1</span>
                  <span class="buy-taco-view__step-label">Fund your wallet with ICP using {{ selectedProvider === 'coinbase' ? 'Coinbase' : 'Transak' }}</span>
                </div>
                <span class="buy-taco-view__timeline-arrow"><i class="fa-solid fa-chevron-right"></i></span>
                <div class="buy-taco-view__timeline-step">
                  <span class="buy-taco-view__step-num">2</span>
                  <span v-if="selectedProduct === 'nachos'" class="buy-taco-view__step-label">ICP is deposited to your NACHOS vault address</span>
                  <span v-else class="buy-taco-view__step-label">ICP is deposited to your personal wallet</span>
                </div>
                <span class="buy-taco-view__timeline-arrow"><i class="fa-solid fa-chevron-right"></i></span>
                <div class="buy-taco-view__timeline-step">
                  <span class="buy-taco-view__step-num">3</span>
                  <!-- NACHOS -->
                  <span v-if="selectedProduct === 'nachos' && autoSwapEnabled && !isDevEnvironment()" class="buy-taco-view__step-label">Once ICP arrives, NACHOS are minted automatically at current NAV</span>
                  <span v-else-if="selectedProduct === 'nachos'" class="buy-taco-view__step-label">Click "Mint NACHOS" when ready</span>
                  <!-- TACO -->
                  <span v-else-if="autoSwapEnabled && !isDevEnvironment()" class="buy-taco-view__step-label">Once ICP arrives, swap executes automatically</span>
                  <span v-else class="buy-taco-view__step-label">Click "Swap ICP for TACO" when ready</span>
                </div>
                <span class="buy-taco-view__timeline-arrow"><i class="fa-solid fa-chevron-right"></i></span>
                <div class="buy-taco-view__timeline-step">
                  <span class="buy-taco-view__step-num">4</span>
                  <span v-if="selectedProduct === 'nachos'" class="buy-taco-view__step-label">NACHOS tokens arrive in your wallet</span>
                  <span v-else class="buy-taco-view__step-label">Swap executes on-chain - TACO sent to your wallet</span>
                </div>
              </div>
            </div>

            <!-- login prompt (when not logged in) -->
            <div v-if="!showAsLoggedIn" class="buy-taco-view__login-prompt">
              <i class="fa-solid fa-lock"></i>
              <span>Log in to get started</span>
              <button class="btn iid-login" @click="tacoStore.iidLogIn()">
                <DfinityLogo />
                <span class="taco-text-white">Log in</span>
              </button>
            </div>

            <!-- buy interface (when logged in) -->
            <template v-if="showAsLoggedIn">

              <!-- buy card -->
              <div class="buy-taco-view__buy-card w-100">
                <h3 class="buy-taco-view__section-title">Fund with Fiat</h3>

                <!-- product toggle -->
                <div id="buy-product-toggle" class="buy-taco-view__product-toggle">
                  <button :class="['buy-taco-view__product-btn', { active: selectedProduct === 'taco' }]"
                          :disabled="isExecuting"
                          @click="selectedProduct = 'taco'">
                    TACO
                  </button>
                  <button :class="['buy-taco-view__product-btn', { active: selectedProduct === 'nachos' }]"
                          :disabled="isExecuting"
                          @click="selectedProduct = 'nachos'">
                    NACHOS
                  </button>
                </div>

                <!-- provider toggle -->
                <div class="buy-taco-view__provider-toggle">
                  <button :class="['buy-taco-view__provider-btn', { active: selectedProvider === 'coinbase' }]"
                          @click="selectedProvider = 'coinbase'">
                    Coinbase
                  </button>
                  <button :class="['buy-taco-view__provider-btn', { active: selectedProvider === 'transak' }]"
                          @click="selectedProvider = 'transak'">
                    Transak
                  </button>
                </div>

                <!-- fiat amount + currency -->
                <div class="buy-taco-view__amount-row">
                  <div class="buy-taco-view__input-group" style="flex: 1;">
                    <label class="buy-taco-view__label">Amount</label>
                    <input type="text"
                           inputmode="decimal"
                           v-model="fiatAmount"
                           class="form-control taco-input"
                           placeholder="50" />
                  </div>
                  <div class="buy-taco-view__input-group" style="width: 6rem;">
                    <label class="buy-taco-view__label">Currency</label>
                    <select v-model="fiatCurrency" class="form-control taco-input">
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                      <option value="GBP">GBP</option>
                      <option value="CHF">CHF</option>
                      <option value="CAD">CAD</option>
                      <option value="AUD">AUD</option>
                      <option value="JPY">JPY</option>
                      <option value="INR">INR</option>
                    </select>
                  </div>
                </div>

                <!-- deposit address display -->
                <div class="buy-taco-view__deposit-addr">
                  <label class="buy-taco-view__label">Your ICP Address</label>
                  <code v-if="userLedgerAccountId" class="buy-taco-view__addr-value">{{ userLedgerAccountId }}</code>
                  <code v-else class="buy-taco-view__addr-value">
                    <i class="fa-solid fa-spinner fa-spin me-1"></i>Loading...
                  </code>
                </div>

                <!-- buy button -->
                <button class="btn taco-btn taco-btn--green w-100"
                        :disabled="isExecuting || !userLedgerAccountId"
                        @click="openBuy">
                  <i v-if="isExecuting"
                     class="fa-solid fa-spinner fa-spin me-2"></i>
                  {{ buyButtonLabel }}
                </button>

                <!-- Auto-swap toggle (production only, TACO only) -->
                <div v-if="!isDevEnvironment() && selectedProduct === 'taco'" class="buy-taco-view__auto-toggle mt-2">
                  <label class="d-flex align-items-center gap-2" style="cursor: pointer; font-size: 0.8rem;">
                    <input type="checkbox" v-model="autoSwapEnabled" :disabled="isExecuting" />
                    <span>Auto-swap when ICP arrives</span>
                  </label>
                </div>

                <!-- Manual swap/mint button (when ICP detected and idle) -->
                <div v-if="icpDetected && buyPhase === 'idle'" class="buy-taco-view__icp-detected mt-3">
                  <div class="buy-taco-view__icp-detected-banner">
                    <i class="fa-solid fa-check-circle me-2"></i>
                    <strong>ICP Detected:</strong> {{ formatE8s(detectedIcpAmount) }} ICP in your wallet
                  </div>
                  <button class="btn taco-btn taco-btn--green w-100"
                          @click="handleSwapMintClick">
                    <i class="fa-solid fa-arrow-right-arrow-left me-2"></i>
                    {{ selectedProduct === 'nachos' ? 'Mint NACHOS' : 'Swap ICP for TACO' }}
                  </button>
                </div>
              </div>

              <!-- Failed mint recovery (NACHOS only) -->
              <div v-if="selectedProduct === 'nachos' && failedNachosMints.length > 0" class="buy-taco-view__recovery w-100 mt-3">
                <div class="buy-taco-view__recovery-summary">
                  <i class="fa-solid fa-exclamation-triangle"></i>
                  <strong>{{ failedNachosMints.length }} Failed Mint{{ failedNachosMints.length > 1 ? 's' : '' }}</strong>
                  <span class="text-muted">— ICP transferred but mint incomplete</span>
                </div>
                <div class="buy-taco-view__recovery-content">
                  <div v-for="mint in failedNachosMints" :key="mint.blockNumber" class="buy-taco-view__recovery-item">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <div><strong>{{ formatE8s(BigInt(mint.amount)) }} ICP</strong></div>
                        <div class="text-muted">{{ new Date(mint.timestamp).toLocaleString() }}</div>
                      </div>
                      <div class="d-flex gap-2">
                        <button class="btn btn-sm taco-btn taco-btn--green" @click="retryFailedMint(mint)" title="Complete the mint">
                          <i class="fa-solid fa-rotate-right me-1"></i>
                          Retry
                        </button>
                        <button class="btn btn-sm buy-taco-view__refund-btn" @click="cancelAndRefund(mint)" title="Cancel mint and refund ICP">
                          <i class="fa-solid fa-xmark me-1"></i>
                          Refund
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Progress tracker -->
              <div v-if="buyPhase !== 'idle'" class="buy-taco-view__progress w-100">
                <h3 class="buy-taco-view__section-title">Progress</h3>
                <SwapProgressTracker
                  :steps="activeSteps"
                  :current-step="currentStep"
                  :status="trackerStatus"
                  :status-message="statusMessage"
                  :error-message="buyPhase === 'error' ? executionError : null"
                  :amounts="progressAmounts"
                />
              </div>

            </template>

            <!-- Swap Dialog (TACO swaps — shows quotes & optimal route) -->
            <SwapDialog
              ref="swapDialogRef"
              :show="showSwapDialog"
              :preselected-token="availableTokensForSwap[0]"
              :available-tokens="availableTokensForSwap"
              @close="closeSwapDialog"
              @confirm="handleSwapDialogConfirm"
            />

            <!-- Swap Confirm Dialog (TACO swaps — execution) -->
            <SwapConfirmDialog
              v-if="showSwapConfirmDialog && swapConfirmData"
              :show="showSwapConfirmDialog"
              :swap-data="swapConfirmData"
              @close="closeSwapConfirmDialog"
              @success="handleSwapSuccess"
              @error="handleSwapError"
            />

            <!-- NACHOS Mint Confirm Dialog -->
            <VaultConfirmDialog
              :show="showMintConfirmDialog"
              :data="mintConfirmData"
              @confirm="onMintConfirm"
              @close="onMintConfirmClose"
            />

          </div>

        </div>

      </div>

    </div>

  </div>

</template>

<style scoped lang="scss">

// buy taco view
.buy-taco-view {
  display: flex;
  flex-direction: column;
  color: var(--black-to-white);
  gap: 1rem;
  padding-bottom: 2rem;
  max-width: 800px;
  margin: 0 auto;

  // page header
  &__page-header {
    margin-top: 1.5rem;
    padding: 0.25rem 1.5rem;
    display: flex;
  }

  // section titles - Enhanced with better typography
  &__section-title {
    font-family: 'Rubik', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.875rem;
    color: var(--brown-to-white);
    display: flex;
    align-items: center;
    gap: 0.5rem;

    i {
      color: var(--dark-orange);
      font-size: 1.25rem;
    }
  }

  // system paused banner - Enhanced styling
  &__paused-banner {
    padding: 1rem 1.25rem;
    background-color: rgba(244, 67, 54, 0.15);
    border: 2px solid var(--red);
    border-radius: 0.5rem;
    color: var(--red);
    font-family: 'Rubik', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(244, 67, 54, 0.2);
  }

  // info section - Dark sienna + gold theme
  &__info {
    padding: 1.5rem;
    background: linear-gradient(135deg, var(--card-gradient-from), var(--card-gradient-to));
    border: 2px solid var(--card-border);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);

    @media (max-width: 767.98px) {
      padding: 1.25rem;
    }

    .buy-taco-view__section-title {
      color: var(--gold);
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }
  }

  // horizontal timeline
  &__timeline {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;

    @media (max-width: 767.98px) {
      flex-wrap: wrap;
      gap: 0.75rem;
    }
  }

  &__timeline-step {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.5rem;
    min-width: 0;

    @media (max-width: 767.98px) {
      flex: 0 0 calc(50% - 0.75rem);
    }
  }

  &__timeline-arrow {
    display: flex;
    align-items: center;
    padding-top: 0.35rem;
    color: var(--gold);
    opacity: 0.6;
    font-size: 0.75rem;
    flex-shrink: 0;

    @media (max-width: 767.98px) {
      display: none;
    }
  }

  &__step-label {
    font-family: 'Space Mono', monospace;
    font-size: 0.8rem;
    line-height: 1.4;
    color: rgba(255, 255, 255, 0.9);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  }

  // step numbers with gradient and shadow
  &__step-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--dark-orange), var(--brown));
    color: var(--white);
    font-weight: 700;
    font-size: 0.85rem;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(218, 141, 40, 0.3);
  }

  // login prompt (mirrors NachosVaultView pattern)
  &__login-prompt {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 2rem 1rem;
    font-family: 'Space Mono', monospace;

    > i {
      font-size: 1.5rem;
      opacity: 0.6;
    }

    > span {
      font-size: 0.9rem;
      opacity: 0.75;
    }

    .iid-login {
      display: inline-flex;
      align-items: center;
      gap: 0.325rem;
      margin-top: 0.5rem;

      svg { width: 1.375rem; }

      span {
        font-size: 0.9rem;
      }

      &:active { border-color: transparent; }
    }
  }

  // product toggle - Enhanced with gradients and shadows
  &__product-toggle {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  &__product-btn {
    flex: 1;
    padding: 0.875rem 1.5rem;
    border-radius: 0.5rem;
    border: 2px solid var(--dark-orange);
    background-color: rgba(218, 141, 40, 0.12);
    color: var(--white);
    font-family: 'Rubik', sans-serif;
    font-weight: 600;
    font-size: 1.125rem;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
    opacity: 0.6;

    &:hover:not(.active) {
      background: rgba(254, 214, 108, 0.5);
      color: var(--white);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(218, 141, 40, 0.3);
      opacity: 1;
    }

    &.active {
      background: linear-gradient(135deg, var(--card-active-from), var(--card-active-to));
      color: var(--gold);
      letter-spacing: 0.03em;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      border-color: var(--card-border);
      box-shadow: 0 4px 16px rgba(60, 30, 0, 0.5);
      transform: translateY(-1px);
      opacity: 1;
      font-weight: 700;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
  }

  // provider toggle - Enhanced styling
  &__provider-toggle {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  &__provider-btn {
    flex: 1;
    padding: 0.75rem 1.25rem;
    border-radius: 0.5rem;
    border: 2px solid var(--dark-orange);
    background-color: rgba(218, 141, 40, 0.12);
    color: var(--white);
    font-family: 'Space Mono', monospace;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: 0.6;

    &:hover:not(.active) {
      background: rgba(254, 214, 108, 0.5);
      color: var(--white);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(218, 141, 40, 0.2);
      opacity: 1;
    }

    &.active {
      background: linear-gradient(135deg, var(--card-active-from), var(--card-active-to));
      color: var(--gold);
      letter-spacing: 0.03em;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      border-color: var(--card-border);
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(60, 30, 0, 0.5);
      opacity: 1;
    }
  }

  // buy card - Enhanced padding
  &__buy-card {
    padding: 2rem;
    background: linear-gradient(135deg, var(--card-gradient-from), var(--card-gradient-to));
    border: 2px solid var(--card-border);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);

    @media (max-width: 767.98px) {
      padding: 1.5rem;
    }

    .buy-taco-view__section-title {
      color: var(--gold);
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }
  }

  // amount row - Better spacing
  &__amount-row {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  // input group
  &__input-group {
    margin-bottom: 0;
  }

  // Enhanced labels
  &__label {
    display: block;
    font-family: 'Rubik', sans-serif;
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--brown-to-white);
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  // deposit address - Enhanced styling
  &__deposit-addr {
    margin-bottom: 1.5rem;
  }

  &__addr-value {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    border: 2px solid var(--dark-orange-to-brown);
    border-radius: 0.5rem;
    background: linear-gradient(135deg, var(--light-orange), var(--white));
    font-family: 'Space Mono', monospace;
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--brown);
    word-break: break-all;
  }

  &__addr-error {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.875rem 1rem;
    background-color: rgba(244, 67, 54, 0.1);
    border-radius: 0.5rem;
    border: 2px solid var(--red, #dc3545);
    font-size: 0.9rem;
    font-family: 'Space Mono', monospace;
    color: var(--red, #dc3545);

    .btn {
      font-size: 0.8rem;
      font-family: 'Space Mono', monospace;
      padding: 0.4rem 0.75rem;
    }
  }

  // progress section (wraps SwapProgressTracker)
  &__progress {
    padding: 1.25rem;
    background: linear-gradient(135deg, var(--card-gradient-from), var(--card-gradient-to));
    border: 2px solid var(--card-border);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);

    .buy-taco-view__section-title {
      color: var(--gold);
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }
  }

  // ICP detected banner (manual swap mode)
  &__icp-detected {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  &__icp-detected-banner {
    padding: 0.875rem 1rem;
    background-color: rgba(76, 175, 80, 0.15);
    border: 1px solid var(--success-green);
    border-radius: 0.5rem;
    color: var(--success-green);
    font-family: 'Space Mono', monospace;
    font-size: 0.9rem;
    font-weight: 600;
  }

  &__icp-detected-hint {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
    text-align: center;
  }

  // Failed mint recovery section
  &__recovery {
    padding: 1.25rem 1.5rem;
    border-radius: 0.75rem;
    border: 2px solid var(--dark-orange);
    background: linear-gradient(135deg, var(--card-gradient-from), var(--card-gradient-to));
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }

  &__recovery-summary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: 'Rubik', sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: var(--gold);
    padding: 0.25rem 0;

    i { color: var(--dark-orange); }

    strong { color: var(--gold); }

    .text-muted {
      font-family: 'Space Mono', monospace;
      font-size: 0.8rem;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.65) !important;
    }
  }

  &__recovery-content {
    font-family: 'Space Mono', monospace;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--dark-orange-to-brown);
  }

  &__recovery-item {
    margin-bottom: 0.5rem;

    .d-flex {
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid var(--dark-orange-to-brown);
      border-radius: 0.5rem;
      padding: 0.875rem 1rem;
    }

    strong {
      font-family: 'Space Mono', monospace;
      color: var(--gold);
      font-size: 0.95rem;
    }

    .text-muted {
      font-family: 'Space Mono', monospace;
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.6) !important;
    }
  }

  &__refund-btn {
    font-family: 'Space Mono', monospace;
    font-size: 0.75rem;
    font-weight: 600;
    background: rgba(220, 53, 69, 0.15);
    border: 1px solid rgba(220, 53, 69, 0.5);
    color: #ff8a8a;

    &:hover {
      background: rgba(220, 53, 69, 0.3);
      border-color: var(--red, #dc3545);
      color: #fff;
    }
  }

  // claim section - Enhanced with gradient background
  &__claim {
    background: linear-gradient(135deg, var(--card-gradient-from), var(--card-gradient-to));
    border: 2px solid var(--card-border);
    border-radius: 0.75rem;
    padding: 1.75rem;
    margin-top: 2rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    align-items: center;

    .buy-taco-view__section-title {
      color: var(--gold);
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      align-self: flex-start;
    }
  }

  &__claim-desc {
    font-size: 1rem;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.9);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
    margin-bottom: 1.5rem;
    padding: 1rem;
    background-color: rgba(0, 0, 0, 0.1);
    border-left: 4px solid var(--gold);
    border-radius: 0.375rem;
  }

  &__claim-result {
    margin-top: 1rem;
    padding: 0.875rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.9rem;
    font-family: 'Space Mono', monospace;
    font-weight: 600;

    &--success {
      background-color: rgba(76, 175, 80, 0.15);
      color: var(--success-green);
      border: 1px solid var(--success-green);
    }

    &--error {
      background-color: rgba(244, 67, 54, 0.4);
      color: var(--white);
      border: 2px solid var(--red);
      font-weight: 700;
    }
  }

  // order history - Professional table design
  &__history {
    margin-top: 2rem;
    padding: 1.25rem;
    background: linear-gradient(135deg, var(--card-gradient-from), var(--card-gradient-to));
    border: 2px solid var(--card-border);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    overflow-x: auto;
  }

  &__history-title {
    font-family: 'Rubik', sans-serif;
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: var(--gold);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }

  &__table {
    width: 100%;
    font-family: 'Space Mono', monospace;
    border-collapse: separate;
    border-spacing: 0;
    border: 2px solid var(--card-border);
    border-radius: 0.5rem;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

    thead {
      background: linear-gradient(135deg, var(--card-active-from), var(--card-active-to));

      th {
        padding: 1rem 1.25rem;
        font-family: 'Rubik', sans-serif;
        font-weight: 700;
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--white);
        text-align: left;
      }
    }

    tbody {
      background-color: rgba(0, 0, 0, 0.15);

      tr {
        transition: background-color 0.15s ease;

        &:hover {
          background-color: rgba(0, 0, 0, 0.25);
        }

        &:not(:last-child) {
          td {
            border-bottom: 1px solid var(--table-row-border);
          }
        }
      }

      td {
        padding: 1rem 1.25rem;
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.85);
      }
    }

    @media (max-width: 767.98px) {
      font-size: 0.75rem;

      thead th,
      tbody td {
        padding: 0.75rem 0.5rem;
      }
    }
  }

  // warm dark green buttons to match dark sienna theme
  .taco-btn--green {
    background: linear-gradient(135deg, #5E7A2E, #3D5A1A);
    color: var(--text-cream);
    border: 2px solid #7A8B3A;

    &:hover,
    &:focus {
      background: linear-gradient(135deg, #6E8A38, #4A6A22);
      color: #fff;
    }
  }
}

</style>

<script setup lang="ts">

/////////////
// imports //
/////////////

import TacoTitle from '../components/misc/TacoTitle.vue'
import DfinityLogo from '../assets/images/dfinityLogo.vue'
import SwapProgressTracker from '../components/misc/SwapProgressTracker.vue'
import type { ProgressStep, ProgressAmount } from '../components/misc/SwapProgressTracker.vue'
import SwapDialog from '../components/wallet/SwapDialog.vue'
import SwapConfirmDialog from '../components/wallet/SwapConfirmDialog.vue'
import VaultConfirmDialog from '../components/nachos/VaultConfirmDialog.vue'
import type { ExecutionPlan } from '../composables/useSplitSwap'
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTacoStore } from '../stores/taco.store'
import { useNachosStore } from '../stores/nachos.store'
import { storeToRefs } from 'pinia'
import { isDevEnvironment, getEffectiveNetwork } from '../config/network-config'
import { useAdminCheck } from '../composables/useAdminCheck'
import { useSplitSwap } from '../composables/useSplitSwap'
import { Principal } from '@dfinity/principal'
import { signedSessionHeaders } from '../utils/sign-session-request'
import { tokenImages } from '../components/data/TokenData'

///////////////
// constants //
///////////////

// Coinbase Onramp
const COINBASE_SESSION_WORKER = 'https://taco-onramp-session.xykominos.workers.dev'

// Transak staging
const TRANSAK_API_KEY = 'fac6ce0c-2b65-4982-a2e3-42e1c5fa15dc'
const TRANSAK_BASE_URL = 'https://global-stg.transak.com'
const TACO_BRAND_COLOR = 'DA8D28'

// Deposit detection
const DEPOSIT_POLL_MS = 3_000   // Poll ICP ledger every 3s during deposit phase
const MAX_POLL_DURATION_MS = 1_200_000 // 20 minutes
const ICP_LEDGER_CANISTER_ID = 'ryjl3-tyaaa-aaaaa-aaaba-cai'
const ICP_PRINCIPAL = ICP_LEDGER_CANISTER_ID
const TACO_PRINCIPAL = 'kknbx-zyaaa-aaaaq-aae4a-cai'
const DEPOSIT_MIN_E8S = 10_000n // ~0.0001 ICP — above dust/fee threshold

////////////
// stores //
////////////

const router = useRouter()
const route = useRoute()
const tacoStore = useTacoStore()
const nachosStore = useNachosStore()
const splitSwap = useSplitSwap()
const { userPrincipal, darkModeToggled, userLoggedIn, userLedgerAccountId } = storeToRefs(tacoStore)
const { cachedOperations } = storeToRefs(nachosStore)
const { isAdmin } = useAdminCheck()
const showAsLoggedIn = computed(() => tacoStore.userLoggedIn || tacoStore.tourBypassAuth)

/////////////////
// local state //
/////////////////

type BuyPhase = 'idle' | 'detecting' | 'quoting' | 'executing' | 'complete' | 'error'
type Provider = 'coinbase' | 'transak'
type Product = 'taco' | 'nachos'

// Product & provider
const selectedProduct = ref<Product>(route.query.product === 'nachos' ? 'nachos' : 'taco')
const selectedProvider = ref<Provider>('coinbase')
const fiatAmount = ref('50')
const fiatCurrency = ref('EUR')

// Execution state
const buyPhase = ref<BuyPhase>('idle')
const executionStep = ref('')
const executionError = ref<string | null>(null)
const completionMessage = ref('')
const isExecuting = computed(() => buyPhase.value === 'quoting' || buyPhase.value === 'executing')
const systemPaused = ref(false)

// Baseline ICP balance tracking (for difference calculation)
const baselineIcpBalance = ref(0n)

// Transak SDK instance ref (for cleanup on unmount)
let transakInstance: any = null

// ICP detected in user's wallet
const icpDetected = ref(false)
const detectedIcpAmount = ref(0n)

// Deposit polling
let depositPollInterval: ReturnType<typeof setInterval> | null = null

// Auto-swap toggle (visible only in production)
const autoSwapEnabled = ref(false)

// Swap dialog state (for TACO swaps when auto is off)
const showSwapDialog = ref(false)
const showSwapConfirmDialog = ref(false)
const swapConfirmData = ref<any | null>(null)
const swapDialogRef = ref<any>(null)

// NACHOS mint confirmation dialog
const showMintConfirmDialog = ref(false)
const mintConfirmData = ref<{ title: string; rows: Array<{ label: string; value: string }>; actionLabel: string } | null>(null)
const skipMintConfirmation = ref(localStorage.getItem('nachos_buy_skip_confirm') === 'true')

// ICP token object for SwapDialog
const icpToken = {
  principal: ICP_PRINCIPAL,
  name: 'Internet Computer',
  symbol: 'ICP',
  logo: tokenImages['Internet Computer'] || tokenImages['ICP'] || tokenImages['Default'],
  balance: 0n,
  decimals: 8,
  fee: 10_000n,
}
const availableTokensForSwap = computed(() => {
  const fee = 10_000n
  const spendable = detectedIcpAmount.value > fee ? detectedIcpAmount.value - fee : 0n
  return [
    { ...icpToken, balance: spendable },
    {
      principal: TACO_PRINCIPAL,
      name: 'TACO',
      symbol: 'TACO',
      logo: tokenImages['TACO'] || tokenImages['Default'],
      balance: 0n,
      decimals: 8,
      fee: 10_000n,
    }
  ]
})

////////////////////
// computed props //
////////////////////

const buyButtonLabel = computed(() => {
  if (systemPaused.value) return 'System Paused'
  if (buyPhase.value === 'detecting') return 'Waiting for ICP...'
  if (buyPhase.value === 'quoting') return 'Getting quotes...'
  if (buyPhase.value === 'executing') return 'Executing...'
  return `Fund via ${selectedProvider.value === 'coinbase' ? 'Coinbase' : 'Transak'}`
})

const failedNachosMints = computed(() => {
  return cachedOperations.value
    .filter(op => op.type === 'mint_icp' && op.status === 'failed')
    .sort((a, b) => b.timestamp - a.timestamp) // Most recent first
})

/////////////////////////////
// progress tracker state  //
/////////////////////////////

const TACO_STEPS: ProgressStep[] = [
  { key: 'fund', label: 'Fund Wallet', description: 'ICP deposited to your wallet', activeDescription: 'Waiting for ICP deposit...' },
  { key: 'route', label: 'Find Route', description: 'Optimal split across DEXes', activeDescription: 'Fetching quotes from Kong and ICPSwap...' },
  { key: 'swap', label: 'Execute Swap', description: 'Swap executed on-chain', activeDescription: 'Executing swap...' },
  { key: 'done', label: 'Complete', description: 'TACO in your wallet' },
]

const NACHOS_STEPS: ProgressStep[] = [
  { key: 'fund', label: 'Fund Wallet', description: 'ICP deposited to your wallet', activeDescription: 'Waiting for ICP deposit...' },
  { key: 'mint', label: 'Mint NACHOS', description: 'NACHOS minted at current NAV', activeDescription: 'Minting NACHOS...' },
  { key: 'done', label: 'Complete', description: 'NACHOS in your wallet' },
]

const errorAtStep = ref(0)

watch(buyPhase, (newVal, oldVal) => {
  if (newVal === 'error') {
    const isNachos = selectedProduct.value === 'nachos'
    switch (oldVal) {
      case 'detecting': errorAtStep.value = 0; break
      case 'quoting': errorAtStep.value = 1; break
      case 'executing': errorAtStep.value = isNachos ? 1 : 2; break
      default: errorAtStep.value = 0
    }
  }
})

const activeSteps = computed(() => selectedProduct.value === 'nachos' ? NACHOS_STEPS : TACO_STEPS)

const currentStep = computed(() => {
  const isNachos = selectedProduct.value === 'nachos'
  switch (buyPhase.value) {
    case 'detecting': return 0
    case 'quoting': return 1
    case 'executing': return isNachos ? 1 : 2
    case 'complete': return isNachos ? 2 : 3
    case 'error': return errorAtStep.value
    default: return 0
  }
})

const trackerStatus = computed((): 'idle' | 'active' | 'complete' | 'failed' => {
  switch (buyPhase.value) {
    case 'detecting':
    case 'quoting':
    case 'executing': return 'active'
    case 'complete': return 'complete'
    case 'error': return 'failed'
    default: return 'idle'
  }
})

const statusMessage = computed(() => {
  if (buyPhase.value === 'complete') return completionMessage.value
  if (executionStep.value && isExecuting.value) return executionStep.value
  return ''
})

const progressAmounts = computed((): ProgressAmount[] => {
  const amounts: ProgressAmount[] = []
  if (detectedIcpAmount.value > 0n) {
    amounts.push({ label: 'ICP Amount', value: `${formatE8s(detectedIcpAmount.value)} ICP` })
  }
  if (buyPhase.value === 'complete' && completionMessage.value) {
    amounts.push({ label: 'Result', value: completionMessage.value, highlight: true })
  }
  return amounts
})

///////////////////
// local methods //
///////////////////

/** Format e8s (bigint) to human-readable decimal */
const formatE8s = (e8s: bigint): string => {
  const whole = e8s / 100_000_000n
  const frac = e8s % 100_000_000n
  const fracStr = frac.toString().padStart(8, '0').replace(/0+$/, '')
  return fracStr ? `${whole}.${fracStr}` : whole.toString()
}

/** Generate a unique order ID */
const generateOrderId = (): string => {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).substring(2, 8)
  return `taco-${ts}-${rand}`
}

// ==========================
// Buy / Onramp functions
// ==========================

/** Open the selected provider's purchase widget */
const openBuy = () => {
  if (selectedProvider.value === 'coinbase') openCoinbase()
  else openTransak()
}

/** Open Coinbase Onramp popup — always deposits to user's personal wallet */
const openCoinbase = async () => {
  if (!userLedgerAccountId.value) return

  // Capture baseline ICP balance FIRST
  try {
    baselineIcpBalance.value = await tacoStore.icrc1BalanceOf(
      ICP_LEDGER_CANISTER_ID,
      Principal.fromText(tacoStore.userPrincipal),
      new Uint8Array(32)  // Explicit default subaccount (matches VaultFiatMint)
    )
  } catch (e) {
    console.warn('Failed to capture baseline balance:', e)
    baselineIcpBalance.value = 0n
  }

  // THEN reset detected state
  icpDetected.value = false
  detectedIcpAmount.value = 0n

  try {
    const sessionBody = {
      addresses: [{ address: userLedgerAccountId.value }],
      assets: ['ICP'],
    }
    const resp = await fetch(COINBASE_SESSION_WORKER, {
      method: 'POST',
      headers: await signedSessionHeaders(sessionBody, tacoStore.signWithUserIdentity),
      body: JSON.stringify(sessionBody),
    })
    if (!resp.ok) {
      const err = await resp.json()
      throw new Error(`Session token error: ${err.error} ${err.details || ''}`)
    }
    const { token: sessionToken } = await resp.json()

    const { generateOnRampURL } = await import('@coinbase/cbpay-js')

    const onrampUrl = generateOnRampURL({
      sessionToken,
      addresses: { [userLedgerAccountId.value]: [] },
      assets: ['ICP'],
      presetFiatAmount: Number(fiatAmount.value) || 50,
      theme: 'dark',
    })

    buyPhase.value = 'detecting'
    const popup = window.open(onrampUrl, 'coinbase-onramp', 'width=500,height=700,scrollbars=yes,resizable=yes')
    startDepositPolling()

    // Grace period when popup closes
    const popupPoll = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(popupPoll)
        // 5-min grace if still detecting
        setTimeout(() => {
          if (buyPhase.value === 'detecting') {
            buyPhase.value = 'idle'
            stopDepositPolling()
          }
        }, 300_000)
      }
    }, 1500)

  } catch (err: any) {
    console.error('Failed to open Coinbase Onramp:', err)
    buyPhase.value = 'error'
    executionError.value = `Failed to open payment widget: ${err.message || err}`
  }
}

/** Build Transak widget URL */
const buildTransakUrl = (addr: string, title: string): string => {
  const params = new URLSearchParams({
    apiKey: TRANSAK_API_KEY,
    referrerDomain: window.location.origin,
    productsAvailed: 'BUY',
    cryptoCurrencyCode: 'ICP',
    cryptoCurrencyList: 'ICP',
    network: 'mainnet',
    walletAddress: addr,
    disableWalletAddressForm: 'true',
    exchangeScreenTitle: title,
    themeColor: TACO_BRAND_COLOR,
    hideMenu: 'true',
    hideExchangeScreen: 'true',
    isFeeCalculationHidden: 'true',
    defaultFiatCurrency: fiatCurrency.value,
    defaultFiatAmount: fiatAmount.value || '50',
    partnerCustomerId: userPrincipal.value,
    partnerOrderId: generateOrderId(),
    colorMode: 'DARK',
  })

  return `${TRANSAK_BASE_URL}?${params.toString()}`
}

/** Open Transak widget — always deposits to user's personal wallet */
const openTransak = async () => {
  if (!userLedgerAccountId.value) return

  // Capture baseline ICP balance FIRST
  try {
    baselineIcpBalance.value = await tacoStore.icrc1BalanceOf(
      ICP_LEDGER_CANISTER_ID,
      Principal.fromText(tacoStore.userPrincipal),
      new Uint8Array(32)  // Explicit default subaccount (matches VaultFiatMint)
    )
  } catch (e) {
    console.warn('Failed to capture baseline balance:', e)
    baselineIcpBalance.value = 0n
  }

  // THEN reset detected state
  icpDetected.value = false
  detectedIcpAmount.value = 0n

  try {
    buyPhase.value = 'detecting'

    const { Transak } = await import('@transak/ui-js-sdk')
    const widgetUrl = buildTransakUrl(userLedgerAccountId.value, selectedProduct.value === 'nachos' ? 'Buy NACHOS' : 'Buy TACO')
    transakInstance = new Transak({ widgetUrl })
    transakInstance.init()

    startDepositPolling()

    Transak.on(Transak.EVENTS.TRANSAK_ORDER_CREATED, (data: any) => {
      console.log('Transak order created:', data)
    })

    Transak.on(Transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, (data: any) => {
      console.log('Transak order successful:', data)
    })

    Transak.on(Transak.EVENTS.TRANSAK_WIDGET_CLOSE, () => {
      console.log('Transak widget closed')
      if (transakInstance) {
        transakInstance.close()
        transakInstance = null
      }
      // 5-min grace
      setTimeout(() => {
        if (buyPhase.value === 'detecting') {
          buyPhase.value = 'idle'
          stopDepositPolling()
        }
      }, 300_000)
    })

  } catch (err: any) {
    console.error('Failed to initialize Transak:', err)
    buyPhase.value = 'error'
    executionError.value = `Failed to open payment widget: ${err.message || err}`
  }
}

// ==========================
// Deposit polling (ICP ledger)
// ==========================

/** Poll user's personal wallet for ICP balance increase */
const startDepositPolling = () => {
  stopDepositPolling()
  const startedAt = Date.now()
  let pollingStopped = false  // Guard flag to prevent race conditions

  depositPollInterval = setInterval(async () => {
    if (Date.now() - startedAt > MAX_POLL_DURATION_MS) {
      stopDepositPolling()
      pollingStopped = true
      // Only set error if ICP wasn't already detected
      if (!icpDetected.value) {
        buyPhase.value = 'error'
        executionError.value = 'Timed out waiting for ICP deposit.'
      }
      return
    }

    try {
      const currentBalance = await tacoStore.icrc1BalanceOf(
        ICP_LEDGER_CANISTER_ID,
        Principal.fromText(tacoStore.userPrincipal),
        new Uint8Array(32)  // Explicit default subaccount (matches VaultFiatMint)
      )

      if (currentBalance === false) return
      const currentBalanceBigInt = BigInt(currentBalance)
      const balanceDifference = currentBalanceBigInt - baselineIcpBalance.value

      if (balanceDifference > DEPOSIT_MIN_E8S && !pollingStopped) {
        stopDepositPolling()
        pollingStopped = true  // Prevent multiple executions
        icpDetected.value = true
        detectedIcpAmount.value = balanceDifference

        // Auto-execute if toggle checked (production only); otherwise show confirmation button
        if (autoSwapEnabled.value && !isDevEnvironment()) {
          handleSwapMintClick()
        } else {
          buyPhase.value = 'idle'
        }
      }
    } catch (error) {
      console.error('Deposit polling error:', error)
    }
  }, DEPOSIT_POLL_MS)
}

/** Stop deposit polling */
const stopDepositPolling = () => {
  if (depositPollInterval) {
    clearInterval(depositPollInterval)
    depositPollInterval = null
  }
}

// ==========================
// Swap / mint routing
// ==========================

/** Route swap/mint click: NACHOS always direct, TACO opens SwapDialog or direct-executes */
const handleSwapMintClick = () => {
  if (!icpDetected.value || detectedIcpAmount.value === 0n) return

  if (selectedProduct.value === 'nachos') {
    // NACHOS: show confirmation dialog (unless skipped)
    requestMintNachos()
  } else if (autoSwapEnabled.value) {
    // TACO + auto: direct execute with 5% max slippage
    executeDirectSwap()
  } else {
    // TACO + manual: open SwapDialog for quote review
    showSwapDialog.value = true
  }
}

/** Direct swap execution (auto mode — 5% max slippage) */
const executeDirectSwap = async () => {
  const amount = detectedIcpAmount.value
  if (amount === 0n) return
  if (isDevEnvironment()) {
    console.log('[BUY executeDirectSwap]', { amount: amount.toString(), network: getEffectiveNetwork() })
  }

  try {
    buyPhase.value = 'quoting'
    executionStep.value = 'Finding best swap route...'

    const plan = await splitSwap.findBestExecution(
      ICP_PRINCIPAL,
      'ICP',
      TACO_PRINCIPAL,
      'TACO',
      amount,
      6000 // 60% max slippage in basis points
    )

    buyPhase.value = 'executing'

    const result = await splitSwap.executePlan(
      plan,
      ICP_PRINCIPAL,
      'ICP',
      TACO_PRINCIPAL,
      'TACO',
      0.60, // 60% slippage tolerance as decimal
      (leg: string, step: string) => {
        executionStep.value = `${leg}: ${step}`
      }
    )

    const failures = result.results.filter(r => !r.success)
    if (failures.length > 0 && result.totalOut === 0n) {
      throw new Error(failures.map(f => `${f.exchange}: ${f.error}`).join('; '))
    }

    if (isDevEnvironment()) console.log('[BUY executeDirectSwap] Total TACO:', result.totalOut.toString())
    buyPhase.value = 'complete'
    completionMessage.value = `Received ${formatE8s(result.totalOut)} TACO!`
    if (failures.length > 0) {
      const failedNames = failures.map(f => f.exchange).join(', ')
      completionMessage.value += ` (${failedNames} leg failed, partial execution)`
    }

    // Reset ICP detected state
    icpDetected.value = false
    detectedIcpAmount.value = 0n

  } catch (err: any) {
    console.error('TACO swap execution failed:', err)
    buyPhase.value = 'error'
    executionError.value = err.message || 'Swap failed'
  }
}

/** Show NACHOS mint confirmation dialog (or skip if user opted out) */
const requestMintNachos = async () => {
  if (skipMintConfirmation.value) { executeDirectMint(); return }

  const amount = detectedIcpAmount.value
  if (amount === 0n) return
  const depositAmount = amount > 10_000n ? amount - 10_000n : 0n

  // Fetch estimate for display
  let nachosEstimate = '...'
  try {
    const est = await nachosStore.estimateMintICP(depositAmount)
    nachosEstimate = nachosStore.formatNachos(est.nachosEstimate)
  } catch { /* fallback to '...' */ }

  mintConfirmData.value = {
    title: 'Confirm NACHOS Mint',
    rows: [
      { label: 'ICP Deposit', value: `${formatE8s(depositAmount)} ICP` },
      { label: 'Transfer Fee', value: '0.0001 ICP' },
      { label: 'Est. NACHOS', value: nachosEstimate },
    ],
    actionLabel: 'Mint NACHOS',
  }
  showMintConfirmDialog.value = true
}

const onMintConfirm = (dontShowAgain: boolean) => {
  if (dontShowAgain) {
    localStorage.setItem('nachos_buy_skip_confirm', 'true')
    skipMintConfirmation.value = true
  }
  showMintConfirmDialog.value = false
  executeDirectMint()
}

const onMintConfirmClose = () => {
  showMintConfirmDialog.value = false
  mintConfirmData.value = null
}

/** Direct mint execution (NACHOS) */
const executeDirectMint = async () => {
  const amount = detectedIcpAmount.value
  if (amount === 0n) return
  if (isDevEnvironment()) {
    console.log('[BUY executeDirectMint]', { amount: amount.toString(), network: getEffectiveNetwork() })
  }

  try {
    buyPhase.value = 'executing'
    executionStep.value = 'Minting NACHOS at current NAV...'

    const mintResult = await nachosStore.mintWithICP(amount)

    if (isDevEnvironment()) console.log('[BUY executeDirectMint] Result:', mintResult)
    buyPhase.value = 'complete'
    if (mintResult && typeof mintResult === 'object' && 'nachosReceived' in mintResult) {
      completionMessage.value = `Received ${formatE8s(mintResult.nachosReceived as bigint)} NACHOS!`
    } else {
      completionMessage.value = 'NACHOS minted successfully!'
    }

    // Reset ICP detected state
    icpDetected.value = false
    detectedIcpAmount.value = 0n

  } catch (err: any) {
    console.error('NACHOS mint execution failed:', err)
    buyPhase.value = 'error'
    executionError.value = err.message || 'Mint failed'
  }
}

/** Retry a failed NACHOS mint */
const retryFailedMint = async (failedOp: any) => {
  if (!failedOp || !failedOp.amount) return

  const amount = BigInt(failedOp.amount)

  // Confirm with user
  if (!confirm(`Retry minting ${formatE8s(amount)} ICP → NACHOS?\n\nThe ICP was already transferred in the previous attempt. This will complete the mint.`)) {
    return
  }

  // Use the same executeDirectMint logic
  detectedIcpAmount.value = amount
  await executeDirectMint()
}

/** Cancel failed mint and refund ICP */
const cancelAndRefund = async (failedOp: any) => {
  if (!failedOp || !failedOp.blockNumber || !failedOp.amount) return

  const amount = BigInt(failedOp.amount)
  const blockNumber = BigInt(failedOp.blockNumber)

  if (!confirm(`Cancel mint and refund ${formatE8s(amount)} ICP back to your wallet?\n\nA small cancellation fee may apply.`)) {
    return
  }

  try {
    buyPhase.value = 'executing'
    executionStep.value = 'Cancelling deposit and initiating refund...'

    const result = await nachosStore.cancelDeposit(ICP_LEDGER_CANISTER_ID, blockNumber)

    buyPhase.value = 'complete'

    if (result?.alreadyResolved) {
      completionMessage.value = 'This deposit was already processed. Removed from list.'
      tacoStore.addToast({
        id: Date.now(),
        code: 'refund-resolved',
        title: 'Deposit Already Resolved',
        icon: 'fa-solid fa-check',
        message: 'This deposit was already processed.'
      })
    } else {
      completionMessage.value = 'Refund initiated! Your ICP will be returned shortly.'
      tacoStore.addToast({
        id: Date.now(),
        code: 'refund-success',
        title: 'Refund Initiated',
        icon: 'fa-solid fa-check',
        message: 'Refund task created. ICP will be returned shortly.'
      })
    }

  } catch (err: any) {
    console.error('Cancel and refund failed:', err)
    buyPhase.value = 'error'
    executionError.value = err.message || 'Refund failed'

    tacoStore.addToast({
      id: Date.now(),
      code: 'refund-error',
      title: 'Refund Failed',
      icon: 'fa-solid fa-exclamation-triangle',
      message: err.message || 'Could not cancel deposit'
    })
  }
}

// ==========================
// Swap dialog handlers
// ==========================

/** Close swap dialog and clear state */
const closeSwapDialog = () => {
  showSwapDialog.value = false
  if (swapDialogRef.value && swapDialogRef.value.clearSwapData) {
    swapDialogRef.value.clearSwapData()
  }
}

/** Handle swap dialog confirm → open confirmation dialog */
const handleSwapDialogConfirm = (swapData: any) => {
  if (!swapData) {
    console.error('No swap data provided')
    return
  }
  swapConfirmData.value = swapData
  showSwapDialog.value = false
  showSwapConfirmDialog.value = true
}

/** Close swap confirmation dialog */
const closeSwapConfirmDialog = () => {
  showSwapConfirmDialog.value = false
  swapConfirmData.value = null
}

/** Handle successful swap from confirmation dialog */
const handleSwapSuccess = async (result: any) => {
  closeSwapConfirmDialog()

  buyPhase.value = 'complete'
  completionMessage.value = result.message || 'Swap completed successfully!'

  // Reset ICP detected state
  icpDetected.value = false
  detectedIcpAmount.value = 0n

  tacoStore.addToast({
    id: Date.now(),
    code: 'swap-success',
    title: 'Swap Successful',
    icon: 'fa-solid fa-check',
    message: 'TACO tokens received in your wallet'
  })
}

/** Handle swap error from confirmation dialog */
const handleSwapError = (error: string) => {
  closeSwapConfirmDialog()

  buyPhase.value = 'error'
  executionError.value = error

  tacoStore.addToast({
    id: Date.now(),
    code: 'swap-error',
    title: 'Swap Failed',
    icon: 'fa-solid fa-exclamation-triangle',
    message: error
  })
}


/////////////////////
// lifecycle hooks //
/////////////////////

/** Check if user already has ICP above threshold (for manual swap/mint) */
const checkExistingBalance = async () => {
  if (!userPrincipal.value) return
  try {
    const balance = await tacoStore.icrc1BalanceOf(
      ICP_LEDGER_CANISTER_ID,
      Principal.fromText(userPrincipal.value),
      new Uint8Array(32)  // Explicit default subaccount (matches VaultFiatMint)
    )
    if (balance !== false) {
      const bal = BigInt(balance)
      if (bal > DEPOSIT_MIN_E8S) {
        icpDetected.value = true
        detectedIcpAmount.value = bal
      }
    }
  } catch {
    // Ignore — user just won't see the manual button
  }
}

onMounted(async () => {
  // redirect to home on production (unless admin)
  if (!isDevEnvironment() && !isAdmin.value) {
    router.replace('/')
    return
  }
  // Check for existing ICP balance (enables manual swap/mint)
  if (userPrincipal.value) {
    await checkExistingBalance()
  }
})

// when user logs in after page load
watch(userLoggedIn, async (loggedIn) => {
  if (loggedIn) {
    await checkExistingBalance()
  } else {
    buyPhase.value = 'idle'
    icpDetected.value = false
    detectedIcpAmount.value = 0n
    stopDepositPolling()
  }
})

// Navigation guard: prevent user from leaving during swap execution
const preventNavigation = (e: BeforeUnloadEvent) => {
  e.preventDefault()
  e.returnValue = ''
  return ''
}

watch(isExecuting, (executing) => {
  if (executing) {
    window.addEventListener('beforeunload', preventNavigation)
  } else {
    window.removeEventListener('beforeunload', preventNavigation)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', preventNavigation)
  stopDepositPolling()
  if (transakInstance && typeof transakInstance.close === 'function') {
    transakInstance.close()
  }
  transakInstance = null
})

</script>
