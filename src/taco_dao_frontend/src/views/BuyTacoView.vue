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
                  <span class="buy-taco-view__step-label">Fund your wallet with ICP via Banxa or send it from another wallet</span>
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
                  <span v-if="selectedProduct === 'nachos' && autoSwapEnabled" class="buy-taco-view__step-label">Once ICP arrives, NACHOS are minted automatically at current NAV</span>
                  <span v-else-if="selectedProduct === 'nachos'" class="buy-taco-view__step-label">Click "Mint NACHOS" when ready</span>
                  <!-- TACO -->
                  <span v-else-if="autoSwapEnabled" class="buy-taco-view__step-label">Once ICP arrives, swap executes automatically</span>
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
                          :disabled="isExecuting || !!nachosMintDisabledReason"
                          :title="nachosMintDisabledReason || undefined"
                          @click="selectedProduct = 'nachos'">
                    NACHOS
                  </button>
                </div>

                <!-- provider toggle (Banxa vs Self) -->
                <div class="buy-taco-view__provider-toggle">
                  <button :class="['buy-taco-view__provider-btn', { active: selectedProvider === 'banxa' }]"
                          @click="selectedProvider = 'banxa'">
                    Banxa
                  </button>
                  <button :class="['buy-taco-view__provider-btn', { active: selectedProvider === 'self' }]"
                          @click="selectedProvider = 'self'">
                    Self
                  </button>
                </div>

                <!-- fiat amount + currency (Banxa only) -->
                <div v-if="selectedProvider === 'banxa'" class="buy-taco-view__amount-row">
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
                  <div class="buy-taco-view__addr-row">
                    <code v-if="userLedgerAccountId" class="buy-taco-view__addr-value">{{ userLedgerAccountId }}</code>
                    <code v-else class="buy-taco-view__addr-value">
                      <i class="fa-solid fa-spinner fa-spin me-1"></i>Loading...
                    </code>
                    <button v-if="userLedgerAccountId"
                            type="button"
                            class="btn btn-sm buy-taco-view__copy-addr"
                            @click="copyAddress"
                            title="Copy ICP address">
                      <i class="fa-regular fa-copy"></i>
                      <span>Copy</span>
                    </button>
                  </div>
                  <p class="buy-taco-view__addr-hint">
                    <i class="fa-solid fa-satellite-dish me-1"></i>
                    Any ICP sent to this address is auto-detected within seconds.
                  </p>
                </div>

                <!-- buy button (Banxa only) -->
                <button v-if="selectedProvider === 'banxa'"
                        class="btn taco-btn taco-btn--green w-100"
                        :disabled="!userLedgerAccountId"
                        @click="openBanxa">
                  <i v-if="buyPhase === 'quoting' || buyPhase === 'executing'"
                     class="fa-solid fa-spinner fa-spin me-2"></i>
                  Fund via Banxa
                </button>

                <!-- Auto-action toggle (hidden once ICP is already detected) -->
                <div v-if="!icpDetected" class="buy-taco-view__auto-toggle mt-2">
                  <label class="d-flex align-items-center gap-2" style="cursor: pointer; font-size: 0.8rem;">
                    <input type="checkbox" v-model="autoSwapEnabled" :disabled="isExecuting" />
                    <span>{{ selectedProduct === 'nachos' ? 'Auto-mint' : 'Auto-swap' }} when ICP arrives</span>
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

  &__addr-row {
    display: flex;
    align-items: stretch;
    gap: 0.5rem;
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
    flex: 1;
  }

  &__copy-addr {
    flex-shrink: 0;
    width: 5.5rem;
    padding: 0.5rem 0.875rem;
    border-radius: 0.5rem;
    background: var(--gold);
    color: var(--dark-brown);
    border: 2px solid var(--dark-orange-to-brown);
    font-family: 'Rubik', sans-serif;
    font-weight: 600;
    font-size: 0.8rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;

    &:hover { filter: brightness(1.05); }
    &:active { transform: none; }
  }

  &__addr-hint {
    margin: 0.375rem 0 0;
    font-size: 0.75rem;
    color: var(--black-to-white);
    opacity: 0.65;
    font-style: italic;
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
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTacoStore } from '../stores/taco.store'
import { useNachosStore } from '../stores/nachos.store'
import { storeToRefs } from 'pinia'
import { isDevEnvironment, getEffectiveNetwork } from '../config/network-config'
import { useSplitSwap } from '../composables/useSplitSwap'
import { Principal } from '@dfinity/principal'
import { buildBanxaUrl } from '../utils/onramp/banxa'
import { tokenImages } from '../components/data/TokenData'

///////////////
// constants //
///////////////

// Deposit detection
const DEPOSIT_POLL_MS = 3_000   // Poll ICP ledger every 3s
const ICP_LEDGER_CANISTER_ID = 'ryjl3-tyaaa-aaaaa-aaaba-cai'
const ICP_PRINCIPAL = ICP_LEDGER_CANISTER_ID
const TACO_PRINCIPAL = 'kknbx-zyaaa-aaaaq-aae4a-cai'
const DEPOSIT_MIN_E8S = 10_000n // ~0.0001 ICP — above dust/fee threshold

////////////
// stores //
////////////

const route = useRoute()
const tacoStore = useTacoStore()
const nachosStore = useNachosStore()
const splitSwap = useSplitSwap()
const { userPrincipal, userLoggedIn, userLedgerAccountId } = storeToRefs(tacoStore)
const { cachedOperations } = storeToRefs(nachosStore)
const showAsLoggedIn = computed(() => tacoStore.userLoggedIn || tacoStore.tourBypassAuth)

/////////////////
// local state //
/////////////////

type BuyPhase = 'idle' | 'detecting' | 'quoting' | 'executing' | 'complete' | 'error'
type Product = 'taco' | 'nachos'
type Provider = 'banxa' | 'self'

// Product & provider
const selectedProduct = ref<Product>(route.query.product === 'nachos' ? 'nachos' : 'taco')
const selectedProvider = ref<Provider>('banxa')
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

const failedNachosMints = computed(() => {
  return cachedOperations.value
    .filter(op => op.type === 'mint_icp' && op.status === 'failed')
    .sort((a, b) => b.timestamp - a.timestamp) // Most recent first
})

/** Reason the NACHOS product is currently un-selectable, or null if it's fine.
 *  Grand Tour always bypasses — the tour must be able to demo the NACHOS path.
 *  While vault data is still loading (`dashboardData` null) we stay silent so the button
 *  doesn't flash a scary "circuit breaker" tooltip during the first second of the page.
 */
const nachosMintDisabledReason = computed((): string | null => {
  if (tacoStore.grandTourActive || tacoStore.tourBypassAuth) return null
  if (!nachosStore.dashboardData) return null
  if (nachosStore.systemPaused) return 'Vault paused for maintenance'
  if (!nachosStore.mintingEnabled) return 'Minting is currently disabled'
  if (nachosStore.circuitBreakerActive) return 'Circuit breaker active — minting paused'
  if (nachosStore.hasPausedTokens) return 'An underlying vault token is paused'
  if (!nachosStore.genesisComplete) return 'Vault not yet initialized'
  if (nachosStore.maxMintPer4h > 0n && nachosStore.globalMintIn4h >= nachosStore.maxMintPer4h) {
    return 'Global mint quota reached for this 4h window — try again later'
  }
  if (nachosStore.remainingMintICP !== null && nachosStore.remainingMintICP <= 0) {
    return 'Your mint quota reached for this 4h window'
  }
  if (nachosStore.remainingMintOps !== null && nachosStore.remainingMintOps <= 0) {
    return 'Your mint operations limit reached for this 4h window'
  }
  return null
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

// ==========================
// Buy / Onramp functions
// ==========================

/** Copy the user's ICP account id to clipboard and flash a toast */
const copyAddress = async () => {
  if (!userLedgerAccountId.value) return
  try {
    await navigator.clipboard.writeText(userLedgerAccountId.value)
    tacoStore.addToast({
      id: Date.now(),
      code: 'buy-copy-address',
      title: 'Copied',
      icon: 'fa-solid fa-check',
      message: 'ICP address copied to clipboard.'
    })
  } catch (e) {
    console.warn('Clipboard copy failed:', e)
    tacoStore.addToast({
      id: Date.now(),
      code: 'buy-copy-address-error',
      title: 'Copy failed',
      icon: 'fa-solid fa-triangle-exclamation',
      message: 'Could not copy ICP address.'
    })
  }
}

/** Read current ICP balance and store as baseline (doesn't touch detection state) */
const captureBaseline = async () => {
  try {
    const bal = await tacoStore.icrc1BalanceOf(
      ICP_LEDGER_CANISTER_ID,
      Principal.fromText(tacoStore.userPrincipal),
      new Uint8Array(32)
    )
    baselineIcpBalance.value = bal !== false ? BigInt(bal) : 0n
  } catch (e) {
    console.warn('Failed to capture baseline balance:', e)
    baselineIcpBalance.value = 0n
  }
}

/** Capture baseline AND reset detection — used when starting a fresh Banxa buy session */
const prepareForDeposit = async () => {
  await captureBaseline()
  icpDetected.value = false
  detectedIcpAmount.value = 0n
}

/** After provider tab opens, poll until it closes, then give a 5-min grace period */
const watchPopupForGrace = (popup: Window | null) => {
  const popupPoll = setInterval(() => {
    if (!popup || popup.closed) {
      clearInterval(popupPoll)
      setTimeout(() => {
        if (buyPhase.value === 'detecting') {
          buyPhase.value = 'idle'
          stopDepositPolling()
        }
      }, 300_000)
    }
  }, 1500)
}

/** Open Banxa checkout in a new tab — deposits to user's personal wallet */
const openBanxa = async () => {
  if (!userLedgerAccountId.value) return

  await prepareForDeposit()

  try {
    const url = buildBanxaUrl({
      walletAddress: userLedgerAccountId.value,
      fiatAmount: Number(fiatAmount.value) || 50,
      fiatCurrency: fiatCurrency.value,
    })

    buyPhase.value = 'detecting'
    const popup = window.open(url, '_blank', 'noopener,noreferrer')
    startDepositPolling()
    watchPopupForGrace(popup)
  } catch (err: any) {
    console.error('Failed to open Banxa:', err)
    buyPhase.value = 'error'
    executionError.value = `Failed to open payment page: ${err.message || err}`
  }
}


// ==========================
// Deposit polling (ICP ledger)
// ==========================

/** Poll user's personal wallet for ICP balance increase */
const startDepositPolling = () => {
  stopDepositPolling()
  let pollingStopped = false  // Guard flag to prevent race conditions

  depositPollInterval = setInterval(async () => {
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

        // Auto-execute if toggle checked; otherwise show confirmation button
        if (autoSwapEnabled.value) {
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

/** Route swap/mint click based on product + auto toggle */
const handleSwapMintClick = () => {
  if (!icpDetected.value || detectedIcpAmount.value === 0n) return

  if (selectedProduct.value === 'nachos') {
    if (autoSwapEnabled.value) {
      // NACHOS + auto: skip confirmation, mint directly
      executeDirectMint()
    } else {
      // NACHOS + manual: show confirmation dialog (unless user opted into skip)
      requestMintNachos()
    }
  } else if (autoSwapEnabled.value) {
    // TACO + auto: split-route execute with 60% max slippage
    executeDirectSwap()
  } else {
    // TACO + manual: open SwapDialog for quote review
    showSwapDialog.value = true
  }
}

/** Direct swap execution (auto mode — 60% max slippage) */
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

/** Start continuous background monitoring:
 *  - baseline = current balance (so future deposits are detected as deltas)
 *  - if existing balance is above dust, surface it as already-detected so user can swap/mint it right now
 */
const startBackgroundMonitor = async () => {
  if (!userPrincipal.value) return
  await captureBaseline()
  if (baselineIcpBalance.value > DEPOSIT_MIN_E8S) {
    icpDetected.value = true
    detectedIcpAmount.value = baselineIcpBalance.value
  } else {
    icpDetected.value = false
    detectedIcpAmount.value = 0n
  }
  startDepositPolling()
}

onMounted(async () => {
  if (userLoggedIn.value) {
    await startBackgroundMonitor()
  }
})

// when user logs in after page load
watch(userLoggedIn, async (loggedIn) => {
  if (loggedIn) {
    await startBackgroundMonitor()
  } else {
    buyPhase.value = 'idle'
    icpDetected.value = false
    detectedIcpAmount.value = 0n
    stopDepositPolling()
  }
})

// after a swap/mint completes, re-baseline and resume monitoring so the next deposit is caught
watch(buyPhase, async (newPhase) => {
  if (newPhase === 'complete' && userLoggedIn.value) {
    setTimeout(async () => {
      if (buyPhase.value === 'complete') await startBackgroundMonitor()
    }, 4000)
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
})

</script>
