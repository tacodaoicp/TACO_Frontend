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
                  <span v-if="selectedProduct === 'nachos'" class="buy-taco-view__step-label">Once ICP arrives, NACHOS are minted at current NAV</span>
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
            <div v-if="!tacoStore.userLoggedIn" class="buy-taco-view__login-prompt">
              <i class="fa-solid fa-lock"></i>
              <span>Log in to get started</span>
              <button class="btn iid-login" @click="tacoStore.iidLogIn()">
                <DfinityLogo />
                <span class="taco-text-white">Log in</span>
              </button>
            </div>

            <!-- buy interface (when logged in) -->
            <template v-if="tacoStore.userLoggedIn">

              <!-- buy card -->
              <div class="buy-taco-view__buy-card w-100">
                <h3 class="buy-taco-view__section-title">Fund with Fiat</h3>

                <!-- product toggle -->
                <div class="buy-taco-view__product-toggle">
                  <button :class="['buy-taco-view__product-btn', { active: selectedProduct === 'taco' }]"
                          :disabled="anySwapActive"
                          @click="selectedProduct = 'taco'">
                    TACO
                  </button>
                  <button :class="['buy-taco-view__product-btn', { active: selectedProduct === 'nachos' }]"
                          :disabled="anySwapActive"
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

                <!-- auto-swap checkbox -->
                <label class="buy-taco-view__autoswap-toggle mt-3 mb-3">
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      v-model="autoSwapEnabled"
                      :disabled="anySwapActive || depositPollInterval !== null"
                    >
                    <span class="form-check-label">
                      <i class="fa-solid fa-bolt me-1"></i>
                      <strong>Auto-{{ selectedProduct === 'nachos' ? 'mint' : 'swap' }} when ICP arrives</strong>
                    </span>
                  </div>
                  <p class="text-muted small mb-0 ms-4">
                    <span v-if="!autoSwapEnabled">
                      <i class="fa-solid fa-shield-check me-1"></i>
                      ICP goes to your personal wallet, you control when to {{ selectedProduct === 'nachos' ? 'mint' : 'swap' }} (recommended for compliance)
                    </span>
                    <span v-else>
                      <i class="fa-solid fa-zap me-1"></i>
                      ICP sent to {{ selectedProduct === 'nachos' ? 'vault' : 'swap canister' }} and automatically {{ selectedProduct === 'nachos' ? 'minted' : 'swapped' }} (instant, convenient)
                    </span>
                  </p>
                </label>

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
                  <code v-if="activeDepositAddress" class="buy-taco-view__addr-value">{{ activeDepositAddress }}</code>
                  <div v-else-if="activeAddrError" class="buy-taco-view__addr-error">
                    <span>Failed to load address</span>
                    <button class="btn btn-sm taco-btn" @click="retryLoadAddress">
                      <i class="fa-solid fa-arrows-rotate me-1"></i>Retry
                    </button>
                  </div>
                  <code v-else class="buy-taco-view__addr-value">
                    <i class="fa-solid fa-spinner fa-spin me-1"></i>Loading...
                  </code>
                </div>

                <!-- buy button -->
                <button class="btn taco-btn taco-btn--green w-100"
                        :disabled="anySwapActive || !activeDepositAddress || systemPaused"
                        @click="openBuy">
                  <i v-if="anySwapActive"
                     class="fa-solid fa-spinner fa-spin me-2"></i>
                  {{ activeBuyButtonText }}
                </button>

                <!-- Manual swap button (shown when ICP detected in user wallet) -->
                <div v-if="icpDetected && !anySwapActive" class="buy-taco-view__icp-detected mt-3">
                  <div class="buy-taco-view__icp-detected-banner">
                    <i class="fa-solid fa-check-circle me-2"></i>
                    <strong>ICP Detected:</strong> {{ formatE8s(detectedIcpAmount) }} ICP in your wallet
                  </div>
                  <button class="btn taco-btn taco-btn--green w-100"
                          @click="executeManualSwap">
                    <i class="fa-solid fa-arrow-right-arrow-left me-2"></i>
                    {{ selectedProduct === 'nachos' ? 'Mint NACHOS' : 'Swap ICP for TACO' }}
                  </button>
                  <p class="buy-taco-view__icp-detected-hint">
                    This will transfer ICP from your wallet and {{ selectedProduct === 'nachos' ? 'mint NACHOS' : 'swap for TACO' }} tokens
                  </p>
                </div>
              </div>

              <!-- TACO order status + progress tracker -->
              <div v-if="selectedProduct === 'taco' && showProgress"
                   class="buy-taco-view__status w-100">
                <h4 class="buy-taco-view__section-title">Order Status</h4>
                <SwapProgressTracker
                  :steps="TACO_STEPS"
                  :current-step="currentStepNumber"
                  :status="tacoTrackerStatus"
                  :status-message="statusMessage"
                  :retry-count="swapProgress ? Number(swapProgress.retryCount) : 0"
                  :max-retries="MAX_RETRIES"
                  :error-message="progressErrorMessage || orderError"
                  :amounts="tacoAmounts"
                  :elapsed="tacoElapsed"
                />
              </div>

              <!-- NACHOS order status + progress tracker -->
              <div v-if="selectedProduct === 'nachos' && nachosShowProgress"
                   class="buy-taco-view__status w-100">
                <h4 class="buy-taco-view__section-title">Order Status</h4>
                <SwapProgressTracker
                  :steps="NACHOS_STEPS"
                  :current-step="nachosCurrentStep"
                  :status="nachosTrackerStatus"
                  :status-message="nachosStatusMessage"
                  :retry-count="nachosProgress ? Number(nachosProgress.retryCount) : 0"
                  :max-retries="MAX_RETRIES"
                  :error-message="nachosProgressError || nachosError"
                  :amounts="nachosAmounts"
                  :elapsed="nachosElapsed"
                />
              </div>

              <!-- claim pending — only shown when ICP stuck in canister subaccount and not actively swapping -->
              <div v-if="showClaimSection" class="buy-taco-view__claim w-100">
                <h3 class="buy-taco-view__section-title">Complete Your {{ selectedProduct === 'nachos' ? 'NACHOS Mint' : 'TACO Swap' }}</h3>
                <p class="buy-taco-view__claim-desc">
                  Your ICP purchase is complete. To finalize your {{ selectedProduct === 'nachos' ? 'NACHOS mint' : 'swap from ICP to TACO' }},
                  you must explicitly approve the transaction below. You maintain full control of your funds throughout this process.
                </p>
                <button class="btn taco-btn taco-btn--green"
                        :disabled="claiming"
                        @click="selectedProduct === 'nachos' ? claimNachos() : claimTaco()">
                  <i v-if="claiming" class="fa-solid fa-spinner fa-spin me-2"></i>
                  {{ claiming ? 'Processing Approval...' : `Approve ${selectedProduct === 'nachos' ? 'NACHOS Mint' : 'Swap to TACO'}` }}
                </button>
                <div v-if="claimResult"
                     class="buy-taco-view__claim-result"
                     :class="claimResult.success ? 'buy-taco-view__claim-result--success' : 'buy-taco-view__claim-result--error'">
                  {{ claimResult.message }}
                </div>
              </div>

              <!-- TACO order history -->
              <div v-if="selectedProduct === 'taco' && orderHistory.length > 0" class="buy-taco-view__history w-100">
                <h4 class="buy-taco-view__history-title">Order History</h4>
                <table class="buy-taco-view__table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th class="text-end">Fiat</th>
                      <th class="text-end">ICP In</th>
                      <th class="text-end">TACO Out</th>
                      <th class="text-end">Path</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="order in orderHistory" :key="Number(order.id)">
                      <td>{{ formatTimestamp(order.timestamp) }}</td>
                      <td class="text-end">{{ formatFiat(order.fiatAmount, order.fiatCurrency) }}</td>
                      <td class="text-end">{{ formatE8s(order.icpDeposited) }}</td>
                      <td class="text-end">{{ formatE8s(order.tacoReceived) }}</td>
                      <td class="text-end">{{ formatClaimPath(order.claimPath) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- NACHOS order history -->
              <div v-if="selectedProduct === 'nachos' && nachosOrderHistory.length > 0" class="buy-taco-view__history w-100">
                <h4 class="buy-taco-view__history-title">Order History</h4>
                <table class="buy-taco-view__table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th class="text-end">Fiat</th>
                      <th class="text-end">ICP In</th>
                      <th class="text-end">NACHOS Out</th>
                      <th class="text-end">NAV</th>
                      <th class="text-end">Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="order in nachosOrderHistory" :key="Number(order.id)">
                      <td>{{ formatTimestamp(order.timestamp) }}</td>
                      <td class="text-end">{{ formatFiat(order.fiatAmount, order.fiatCurrency) }}</td>
                      <td class="text-end">{{ formatE8s(order.icpDeposited) }}</td>
                      <td class="text-end">{{ formatE8s(order.nachosReceived) }}</td>
                      <td class="text-end">{{ formatE8s(order.navUsed) }}</td>
                      <td class="text-end">{{ formatE8s(order.feeICP) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </template>

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

  // Auto-swap checkbox - Custom styled with warm tones
  &__autoswap-toggle {
    display: block;
    cursor: pointer;
    background: linear-gradient(135deg, var(--card-gradient-from), var(--card-gradient-to));
    border: 2px solid var(--card-border);
    border-radius: 0.5rem;
    padding: 1rem 1.25rem;
    margin: 1.5rem 0;
    transition: all 0.2s ease;

    &:hover {
      background: linear-gradient(135deg, var(--card-hover-from), var(--card-hover-to));
      box-shadow: 0 2px 8px rgba(60, 30, 0, 0.2);
    }

    .form-check {
      margin-bottom: 0.5rem;

      input[type="checkbox"] {
        width: 1.25rem;
        height: 1.25rem;
        border: 2px solid var(--checkbox-border);
        border-radius: 0.25rem;
        cursor: pointer;

        &:checked {
          background-color: var(--dark-orange);
          border-color: var(--brown);
        }

        &:focus {
          box-shadow: 0 0 0 3px rgba(218, 141, 40, 0.25);
        }
      }

      .form-check-label {
        font-family: 'Rubik', sans-serif;
        font-weight: 600;
        font-size: 1rem;
        color: var(--gold);
        cursor: pointer;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);

        i {
          color: var(--gold-light);
        }
      }
    }

    p.text-muted {
      font-size: 0.875rem;
      line-height: 1.5;
      margin-left: 2rem;
      margin-bottom: 0;
      color: #FFFFFF !important;
      opacity: 0.9;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);

      i {
        color: var(--gold-light);
        opacity: 1;
      }
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

  // status section
  &__status {
    padding: 1.25rem;
    background: linear-gradient(135deg, var(--card-gradient-from), var(--card-gradient-to));
    border: 2px solid var(--card-border);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);

    .buy-taco-view__section-title {
      color: var(--gold);
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }
  }

  &__status-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-family: 'Space Mono', monospace;
    font-size: 1rem;
  }

  &__status-icon {
    font-size: 1.5rem;
  }

  &__status-text {
    flex: 1;
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
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTacoStore } from '../stores/taco.store'
import { storeToRefs } from 'pinia'
import { getEffectiveNetwork, isDevEnvironment } from '../config/network-config'
import { useAdminCheck } from '../composables/useAdminCheck'
import { Principal } from '@dfinity/principal'
import { Actor, HttpAgent } from '@dfinity/agent'
import { AuthClient } from '@dfinity/auth-client'
import { signedSessionHeaders } from '../utils/sign-session-request'
import type { SwapProgress, SwapDashboard, NachosSwapProgress, NachosOrderRecord } from '../../../declarations/taco_swap/taco_swap.did'

///////////////
// constants //
///////////////

// Coinbase Onramp
const COINBASE_SESSION_WORKER = 'https://taco-onramp-session.xykominos.workers.dev'

// Transak staging
const TRANSAK_API_KEY = 'fac6ce0c-2b65-4982-a2e3-42e1c5fa15dc'
const TRANSAK_BASE_URL = 'https://global-stg.transak.com'
const TACO_BRAND_COLOR = 'DA8D28'

// Swap progress — TACO (7 steps)
const TACO_STEPS: ProgressStep[] = [
  { key: 'waiting',  label: 'Fund Wallet',  description: 'Purchasing ICP via fiat provider',            activeDescription: 'Funding your wallet with ICP...' },
  { key: 'deposit',  label: 'ICP Deposit',  description: 'ICP arriving at your address',                activeDescription: 'Watching for ICP deposit...' },
  { key: 'quote',    label: 'Quote',     description: 'Fetching the best TACO price from ICPSwap',   activeDescription: 'Getting quote...' },
  { key: 'transfer', label: 'Transfer',  description: 'Moving ICP to the swap pool',                 activeDescription: 'Transferring to pool...' },
  { key: 'swap',     label: 'Swap',      description: 'Executing the ICP to TACO swap',              activeDescription: 'Swapping tokens...' },
  { key: 'deliver',  label: 'Deliver',   description: 'Sending TACO to your wallet',                 activeDescription: 'Delivering TACO...' },
  { key: 'done',     label: 'Complete',  description: 'TACO delivered successfully!',                 activeDescription: 'Done!' },
]
const MAX_RETRIES = 3
const POLL_ACTIVE_MS = 2_000    // Active swap: poll every 2s
const POLL_PENDING_MS = 10_000  // Pending retry: poll every 10s
const DEPOSIT_POLL_MS = 3_000   // Poll ICP ledger every 3s during deposit phase
const MAX_POLL_DURATION_MS = 1_200_000 // 20 minutes
const ICP_LEDGER_CANISTER_ID = 'ryjl3-tyaaa-aaaaa-aaaba-cai'
const DEPOSIT_MIN_E8S = 10_000n // ~0.0001 ICP — above dust/fee threshold

// NACHOS (4 steps)
const NACHOS_STEPS: ProgressStep[] = [
  { key: 'deposit',  label: 'Fund Wallet',        description: 'ICP arriving at your address',                   activeDescription: 'Watching for your ICP deposit...' },
  { key: 'treasury', label: 'Treasury Transfer',  description: 'Moving ICP to the NACHOS treasury',             activeDescription: 'Transferring ICP to treasury...' },
  { key: 'minting',  label: 'Mint NACHOS',        description: 'Minting NACHOS tokens based on current NAV',    activeDescription: 'Minting your NACHOS...' },
  { key: 'done',     label: 'Complete',            description: 'NACHOS delivered to your wallet',               activeDescription: 'Done!' },
]

////////////
// stores //
////////////

const router = useRouter()
const route = useRoute()
const tacoStore = useTacoStore()
const { userPrincipal, darkModeToggled, userLoggedIn, userLedgerAccountId } = storeToRefs(tacoStore)
const { isAdmin } = useAdminCheck()

/////////////////
// local state //
/////////////////

type UIPhase = 'idle' | 'registering' | 'polling' | 'success' | 'error'
type Provider = 'coinbase' | 'transak'
type Product = 'taco' | 'nachos'

// Product & provider
const selectedProduct = ref<Product>(route.query.product === 'nachos' ? 'nachos' : 'taco')
const selectedProvider = ref<Provider>('coinbase')
const fiatAmount = ref('50')
const fiatCurrency = ref('EUR')

// TACO state
const uiPhase = ref<UIPhase>('idle')
const orderError = ref<string | null>(null)
const orderId = ref<string | null>(null)
const claiming = ref(false)
const claimResult = ref<{ success: boolean; message: string } | null>(null)
const swapProgress = ref<SwapProgress | null>(null)

// NACHOS state
const nachosPhase = ref<UIPhase>('idle')
const nachosError = ref<string | null>(null)
const nachosProgress = ref<NachosSwapProgress | null>(null)
const nachosOrderHistory = ref<NachosOrderRecord[]>([])
const nachosDepositAddress = ref('')

// canister data (shared/TACO)
const depositAddress = ref('')
const orderHistory = ref<any[]>([])
const systemPaused = ref(false)

// Auto-swap checkbox state
const autoSwapEnabled = ref(false)  // Default: manual mode (unchecked)

// Baseline ICP balance tracking (for difference calculation in manual mode)
const baselineIcpBalance = ref(0n)

// Transak SDK instance ref (for cleanup on unmount)
let transakInstance: any = null

// Deposit subaccounts (from get_full_swap_state)
const tacoDepositSubaccount = ref<Uint8Array | null>(null)
const nachosDepositSubaccount = ref<Uint8Array | null>(null)

// Manual swap state (ICP detected in user's wallet)
const icpDetected = ref(false)
const detectedIcpAmount = ref(0n)

// Live deposit balance (for UI display during Phase 1)
const depositBalance = ref<bigint>(0n)
const nachosDepositBalance = ref<bigint>(0n)

// Pending deposit flags (from SwapDashboard — ICP sitting in canister subaccount)
const hasPendingTacoDeposit = ref(false)
const hasPendingNachosDeposit = ref(false)

// Phase 1: Deposit polling (ICP ledger icrc1_balance_of)
let depositPollInterval: ReturnType<typeof setInterval> | null = null

// Phase 2: Swap polling (get_full_swap_state query)
let unifiedPollInterval: ReturnType<typeof setInterval> | null = null
let currentPollRate = 0

////////////////////
// computed props //
////////////////////

// --- TACO computed ---

const isActive = computed(() =>
  uiPhase.value === 'registering' || uiPhase.value === 'polling'
)

const showProgress = computed(() =>
  uiPhase.value !== 'idle'
)

const isDepositPolling = computed(() =>
  uiPhase.value === 'polling' && depositPollInterval !== null
)

const currentStepNumber = computed(() => {
  if (!swapProgress.value) {
    // During Phase 1 (deposit polling), show step 0 (Waiting)
    if (isDepositPolling.value) return 0
    return -1
  }
  return Number(swapProgress.value.stepNumber)
})

const isComplete = computed(() =>
  swapProgress.value != null && 'Complete' in swapProgress.value.step
)

const isFailed = computed(() =>
  swapProgress.value != null && 'Failed' in swapProgress.value.step
)

const progressIcpAmount = computed(() => {
  const amt = swapProgress.value?.icpAmount
  return amt && amt.length > 0 ? formatE8s(amt[0] as bigint) : null
})

const progressEstimatedTaco = computed(() => {
  const amt = swapProgress.value?.estimatedTaco
  return amt && amt.length > 0 ? formatE8s(amt[0] as bigint) : null
})

const progressActualTaco = computed(() => {
  const amt = swapProgress.value?.actualTaco
  return amt && amt.length > 0 ? formatE8s(amt[0] as bigint) : null
})

const progressErrorMessage = computed(() => {
  const msg = swapProgress.value?.errorMessage
  return msg && msg.length > 0 ? (msg[0] as string) : null
})

const buyButtonText = computed(() => {
  if (systemPaused.value) return 'System Paused'
  if (uiPhase.value === 'registering') return 'Registering...'
  if (uiPhase.value === 'polling') {
    if (isDepositPolling.value) return 'Waiting for ICP...'
    if (swapProgress.value) {
      const step = swapProgress.value.step
      if ('WaitingForDeposit' in step || 'NotStarted' in step) return 'Waiting for ICP...'
      return 'Swapping...'
    }
  }
  return `Fund via ${selectedProvider.value === 'coinbase' ? 'Coinbase' : 'Transak'}`
})

const statusMessage = computed(() => {
  if (uiPhase.value === 'registering') return 'Registering payment with canister...'
  if (icpDetected.value && uiPhase.value === 'idle') {
    return `✓ ICP detected in your wallet: ${formatE8s(detectedIcpAmount.value)} ICP`
  }
  if (isDepositPolling.value) {
    if (depositBalance.value > 0n) return `ICP deposit detected: ${formatE8s(depositBalance.value)} ICP — waiting for swap...`
    return 'Waiting for ICP deposit...'
  }
  if (swapProgress.value && uiPhase.value !== 'idle') return swapProgress.value.description
  if (uiPhase.value === 'error') return orderError.value || 'An error occurred.'
  if (uiPhase.value === 'success') return 'Swap complete! TACO delivered.'
  return ''
})

// --- NACHOS computed ---

const nachosIsActive = computed(() =>
  nachosPhase.value === 'registering' || nachosPhase.value === 'polling'
)

const nachosShowProgress = computed(() =>
  nachosPhase.value !== 'idle'
)

const nachosIsDepositPolling = computed(() =>
  nachosPhase.value === 'polling' && depositPollInterval !== null
)

const nachosCurrentStep = computed(() => {
  if (!nachosProgress.value) {
    if (nachosIsDepositPolling.value) return 0
    return -1
  }
  return Number(nachosProgress.value.stepNumber)
})

const nachosIsComplete = computed(() =>
  nachosProgress.value != null && 'Complete' in nachosProgress.value.step
)

const nachosIsFailed = computed(() =>
  nachosProgress.value != null && 'Failed' in nachosProgress.value.step
)

const nachosProgressIcp = computed(() => {
  const amt = nachosProgress.value?.icpAmount
  return amt && amt.length > 0 ? formatE8s(amt[0] as bigint) : null
})

const nachosProgressEstimated = computed(() => {
  const amt = nachosProgress.value?.estimatedNachos
  return amt && amt.length > 0 ? formatE8s(amt[0] as bigint) : null
})

const nachosProgressActual = computed(() => {
  const amt = nachosProgress.value?.actualNachos
  return amt && amt.length > 0 ? formatE8s(amt[0] as bigint) : null
})

const nachosProgressError = computed(() => {
  const msg = nachosProgress.value?.errorMessage
  return msg && msg.length > 0 ? (msg[0] as string) : null
})

const nachosBuyButtonText = computed(() => {
  if (systemPaused.value) return 'System Paused'
  if (nachosPhase.value === 'registering') return 'Starting...'
  if (nachosPhase.value === 'polling') {
    if (nachosIsDepositPolling.value) return 'Waiting for ICP...'
    if (nachosProgress.value) {
      const step = nachosProgress.value.step
      if ('NotStarted' in step) return 'Waiting for ICP...'
      if ('DepositReceived' in step) return 'Deposit received...'
      if ('TransferringToTreasury' in step) return 'Transferring...'
      if ('MintingNachos' in step) return 'Minting...'
      return 'Processing...'
    }
  }
  return `Fund via ${selectedProvider.value === 'coinbase' ? 'Coinbase' : 'Transak'}`
})

const nachosStatusMessage = computed(() => {
  if (nachosPhase.value === 'registering') return 'Starting NACHOS mint...'
  if (nachosIsDepositPolling.value) {
    if (nachosDepositBalance.value > 0n) return `ICP deposit detected: ${formatE8s(nachosDepositBalance.value)} ICP — claiming...`
    return 'Waiting for ICP deposit...'
  }
  if (nachosProgress.value && nachosPhase.value !== 'idle') return nachosProgress.value.description
  if (nachosPhase.value === 'error') return nachosError.value || 'An error occurred.'
  if (nachosPhase.value === 'success') return 'NACHOS delivered to your wallet!'
  return ''
})

// --- NACHOS terminal failure ---

const nachosIsTerminalFailure = computed(() =>
  nachosIsFailed.value && nachosProgress.value != null
    && nachosProgress.value.retryCount >= BigInt(MAX_RETRIES)
)

// --- Cross-product computed ---

const anySwapActive = computed(() => isActive.value || nachosIsActive.value)

const activeDepositAddress = computed(() => {
  // Manual mode: show user's personal wallet (same for TACO and NACHOS)
  if (!autoSwapEnabled.value) {
    return userLedgerAccountId.value
  }
  // Auto mode: show product-specific deposit address
  return selectedProduct.value === 'nachos' ? nachosDepositAddress.value : depositAddress.value
})

const activeAddrError = computed(() =>
  selectedProduct.value === 'nachos' ? nachosAddrError.value : tacoAddrError.value
)

// Show claim section only when ICP is stuck in canister subaccount and no active swap
const showClaimSection = computed(() => {
  if (selectedProduct.value === 'nachos') {
    const notSwapping = nachosPhase.value === 'idle' || nachosPhase.value === 'error'
    return notSwapping && hasPendingNachosDeposit.value
  }
  const notSwapping = uiPhase.value === 'idle' || uiPhase.value === 'error'
  return notSwapping && hasPendingTacoDeposit.value
})

const retryLoadAddress = () => {
  loadDashboard().catch(console.error)
}

const activeBuyButtonText = computed(() =>
  selectedProduct.value === 'nachos' ? nachosBuyButtonText.value : buyButtonText.value
)

// --- SwapProgressTracker computed ---

const tacoTrackerStatus = computed<'idle' | 'active' | 'complete' | 'failed'>(() => {
  if (uiPhase.value === 'success' || isComplete.value) return 'complete'
  if (uiPhase.value === 'error' || isFailed.value) return 'failed'
  if (isActive.value) return 'active'
  return 'idle'
})

const nachosTrackerStatus = computed<'idle' | 'active' | 'complete' | 'failed'>(() => {
  if (nachosPhase.value === 'success' || nachosIsComplete.value) return 'complete'
  if (nachosPhase.value === 'error' || nachosIsFailed.value) return 'failed'
  if (nachosIsActive.value) return 'active'
  return 'idle'
})

const tacoAmounts = computed<ProgressAmount[]>(() => {
  const items: ProgressAmount[] = []
  if (fiatAmount.value && isActive.value) items.push({ label: 'Fiat paid', value: `${fiatAmount.value} ${fiatCurrency.value}` })
  if (progressIcpAmount.value) items.push({ label: 'ICP deposited', value: `${progressIcpAmount.value} ICP` })
  if (progressEstimatedTaco.value && !isComplete.value) items.push({ label: 'Estimated TACO', value: `~${progressEstimatedTaco.value}` })
  if (progressActualTaco.value) items.push({ label: 'TACO received', value: `${progressActualTaco.value} TACO`, highlight: true })
  return items
})

const nachosAmounts = computed<ProgressAmount[]>(() => {
  const items: ProgressAmount[] = []
  if (fiatAmount.value && nachosIsActive.value) items.push({ label: 'Fiat paid', value: `${fiatAmount.value} ${fiatCurrency.value}` })
  if (nachosProgressIcp.value) items.push({ label: 'ICP deposited', value: `${nachosProgressIcp.value} ICP` })
  if (nachosProgressEstimated.value && !nachosIsComplete.value) items.push({ label: 'Estimated NACHOS', value: `~${nachosProgressEstimated.value}` })
  if (nachosProgressActual.value) items.push({ label: 'NACHOS received', value: `${nachosProgressActual.value} NACHOS`, highlight: true })
  return items
})

// --- Elapsed time tracking ---

const tacoStartTime = ref<number | null>(null)
const tacoElapsed = ref(0)
const nachosStartTime = ref<number | null>(null)
const nachosElapsed = ref(0)
let elapsedInterval: ReturnType<typeof setInterval> | null = null

const startElapsedTimer = () => {
  if (elapsedInterval) return
  elapsedInterval = setInterval(() => {
    if (tacoStartTime.value != null && isActive.value) {
      tacoElapsed.value = Math.floor((Date.now() - tacoStartTime.value) / 1000)
    }
    if (nachosStartTime.value != null && nachosIsActive.value) {
      nachosElapsed.value = Math.floor((Date.now() - nachosStartTime.value) / 1000)
    }
    // Stop if neither active
    if (!isActive.value && !nachosIsActive.value) {
      stopElapsedTimer()
    }
  }, 1000)
}

const stopElapsedTimer = () => {
  if (elapsedInterval) {
    clearInterval(elapsedInterval)
    elapsedInterval = null
  }
}

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

/** Format timestamp (nanoseconds) to date string */
const formatTimestamp = (ns: bigint): string => {
  const ms = Number(ns / 1_000_000n)
  return new Date(ms).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Format ClaimPath variant to display string */
const formatClaimPath = (path: any): string => {
  if ('FrontendClaim' in path) return 'Auto'
  if ('WebhookClaim' in path) return 'Webhook'
  if ('ManualClaim' in path) return 'Manual'
  if ('TimerSweep' in path) return 'Timer'
  if ('CoinbaseWebhook' in path) return 'Coinbase'
  return '?'
}

/** Format optional fiat amount + currency from Candid opt fields */
const formatFiat = (amount: [] | [string], currency: [] | [string]): string => {
  const a = amount?.[0]
  const c = currency?.[0]
  if (!a) return '—'
  return c ? `${a} ${c}` : a
}

/** Generate a unique order ID */
const generateOrderId = (): string => {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).substring(2, 8)
  return `taco-${ts}-${rand}`
}

// ==========================
// TACO functions
// ==========================

const tacoAddrError = ref(false)

/** Load canister config (system paused state) — anonymous, works pre-login */
const loadConfig = async () => {
  try {
    const actor = await tacoStore.createTacoSwapActorAnonymous()
    const config = await (actor as any).get_config()
    systemPaused.value = config.systemPaused
  } catch (err) {
    console.error('Failed to load swap config:', err)
  }
}

/** Open the selected provider's purchase widget */
const openBuy = () => {
  if (selectedProduct.value === 'nachos') {
    if (selectedProvider.value === 'coinbase') openCoinbaseNachos()
    else openTransakNachos()
  } else {
    if (selectedProvider.value === 'coinbase') openCoinbase()
    else openTransak()
  }
}

/** Register payment intent with the canister (TACO only). Returns true if OK to proceed. */
const registerPayment = async (): Promise<boolean> => {
  try {
    const actor = await tacoStore.createTacoSwapActor()
    const result = await (actor as any).register_payment([])

    if ('NotAuthorized' in result) {
      uiPhase.value = 'error'
      orderError.value = 'Not authorized. Please log in again.'
      return false
    }
    // 'Ok' or 'AlreadyProcessing' — both fine to proceed
    return true
  } catch (err: any) {
    uiPhase.value = 'error'
    orderError.value = `Failed to register payment: ${err.message || err}`
    return false
  }
}

/** Open Coinbase Onramp popup with session token (TACO) */
const openCoinbase = async () => {
  if (!depositAddress.value) {
    orderError.value = 'Deposit address not loaded. Please refresh and try again.'
    uiPhase.value = 'error'
    return
  }

  orderId.value = generateOrderId()
  uiPhase.value = 'registering'
  orderError.value = null
  claimResult.value = null
  swapProgress.value = null
  icpDetected.value = false
  detectedIcpAmount.value = 0n

  // Capture baseline ICP balance (for difference tracking in manual mode)
  if (!autoSwapEnabled.value) {
    try {
      baselineIcpBalance.value = await tacoStore.icrc1BalanceOf(
        ICP_LEDGER_CANISTER_ID,
        Principal.fromText(tacoStore.userPrincipal),
        undefined  // User's default subaccount
      )
    } catch (e) {
      console.warn('Failed to capture baseline balance:', e)
      baselineIcpBalance.value = 0n
    }
  }

  // 0. Register payment intent with backend
  const ok = await registerPayment()
  if (!ok) return

  try {
    // 1. Get session token from CF Worker (signed with frontend identity)
    // Use user's personal wallet address (not swap deposit address)
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

    // 2. Generate Coinbase onramp URL
    const { generateOnRampURL } = await import('@coinbase/cbpay-js')

    // Use user's personal wallet in manual mode, swap deposit address in auto mode
    const targetAddress = autoSwapEnabled.value ? depositAddress.value : userLedgerAccountId.value

    const onrampUrl = generateOnRampURL({
      sessionToken,
      addresses: { [targetAddress]: [] },
      assets: ['ICP'],
      presetFiatAmount: Number(fiatAmount.value) || 50,
      theme: 'dark',
    })

    // 3. Open popup + start Phase 1 deposit polling (ICP ledger)
    uiPhase.value = 'polling'
    tacoStartTime.value = Date.now()
    tacoElapsed.value = 0
    startElapsedTimer()
    const popup = window.open(onrampUrl, 'coinbase-onramp', 'width=500,height=700,scrollbars=yes,resizable=yes')
    startDepositPolling('taco')

    // 4. When popup closes, keep polling — grace period if still waiting for deposit
    const popupPoll = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(popupPoll)
        handlePopupClose(swapProgress, uiPhase, () => {
          swapProgress.value = null
          orderId.value = null
        })
      }
    }, 1500)

  } catch (err: any) {
    console.error('Failed to open Coinbase Onramp:', err)
    uiPhase.value = 'error'
    orderError.value = `Failed to open payment widget: ${err.message || err}`
  }
}

/** Build Transak widget URL with all required query parameters */
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
    partnerOrderId: orderId.value || generateOrderId(),
    colorMode: 'DARK',
  })

  return `${TRANSAK_BASE_URL}?${params.toString()}`
}

/** Open the Transak widget to initiate the purchase flow (TACO) */
const openTransak = async () => {
  if (!depositAddress.value) {
    orderError.value = 'Deposit address not loaded. Please refresh and try again.'
    uiPhase.value = 'error'
    return
  }

  orderId.value = generateOrderId()
  uiPhase.value = 'registering'
  orderError.value = null
  claimResult.value = null
  swapProgress.value = null
  icpDetected.value = false
  detectedIcpAmount.value = 0n

  // 0. Register payment intent with backend
  const ok = await registerPayment()
  if (!ok) return

  try {
    uiPhase.value = 'polling'
    tacoStartTime.value = Date.now()
    tacoElapsed.value = 0
    startElapsedTimer()

    // dynamic import of Transak SDK (lazy load — only downloaded when user clicks Buy)
    const { Transak } = await import('@transak/ui-js-sdk')

    const widgetUrl = buildTransakUrl(depositAddress.value, 'Buy TACO')
    transakInstance = new Transak({ widgetUrl })
    transakInstance.init()

    // Start Phase 1 deposit polling (ICP ledger)
    startDepositPolling('taco')

    // event: order created
    Transak.on(Transak.EVENTS.TRANSAK_ORDER_CREATED, (data: any) => {
      console.log('Transak order created:', data)
    })

    // event: order successful (ICP purchased and sent)
    Transak.on(Transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, (data: any) => {
      console.log('Transak order successful:', data)
    })

    // event: widget closed — must call close() to remove the iframe from DOM
    Transak.on(Transak.EVENTS.TRANSAK_WIDGET_CLOSE, () => {
      console.log('Transak widget closed')
      if (transakInstance) {
        transakInstance.close()
        transakInstance = null
      }
      handlePopupClose(swapProgress, uiPhase, () => {
        swapProgress.value = null
        orderId.value = null
      })
    })

  } catch (err: any) {
    console.error('Failed to initialize Transak:', err)
    uiPhase.value = 'error'
    orderError.value = `Failed to open payment widget: ${err.message || err}`
  }
}

/** Shared popup-close logic: 5-min grace if still at WaitingForDeposit/NotStarted */
const handlePopupClose = (
  progressRef: { value: any },
  phaseRef: { value: UIPhase },
  resetFn: () => void,
) => {
  if (phaseRef.value === 'polling' && progressRef.value) {
    const step = progressRef.value.step
    if ('NotStarted' in step || 'WaitingForDeposit' in step) {
      setTimeout(() => {
        if (phaseRef.value === 'polling' && progressRef.value) {
          const currentStep = progressRef.value.step
          if ('NotStarted' in currentStep || 'WaitingForDeposit' in currentStep) {
            phaseRef.value = 'idle'
            resetFn()
            stopDepositPolling()
            maybeStopPolling()
          }
        }
      }, 300_000) // 5 minutes
    }
  } else if (phaseRef.value === 'polling' && !progressRef.value) {
    setTimeout(() => {
      if (phaseRef.value === 'polling' && !progressRef.value) {
        phaseRef.value = 'idle'
        resetFn()
        stopDepositPolling()
        maybeStopPolling()
      }
    }, 300_000)
  }
}

// ==========================
// Unified polling via getSwapDashboard()
// ==========================

/** Start unified polling — one query updates both TACO and NACHOS state */
const startUnifiedPolling = (intervalMs: number) => {
  // If already polling at a faster or equal rate, don't restart
  if (unifiedPollInterval && intervalMs >= currentPollRate) return

  stopUnifiedPolling()
  currentPollRate = intervalMs
  const startedAt = Date.now()

  unifiedPollInterval = setInterval(async () => {
    // Timeout guard
    if (Date.now() - startedAt > MAX_POLL_DURATION_MS) {
      stopUnifiedPolling()
      if (uiPhase.value === 'polling') {
        uiPhase.value = 'error'
        orderError.value = 'Swap timed out. You can try the manual "Claim TACO" button below.'
      }
      if (nachosPhase.value === 'polling') {
        nachosPhase.value = 'error'
        nachosError.value = 'Mint timed out. You can try the manual "Claim NACHOS" button below.'
      }
      return
    }

    try {
      const actor = await tacoStore.createTacoSwapActor()
      const db: SwapDashboard = await (actor as any).getSwapDashboard()

      // --- Update pending deposit flags ---
      hasPendingTacoDeposit.value = db.hasPendingTaco
      hasPendingNachosDeposit.value = db.hasPendingNachos

      // --- Update TACO ---
      if (uiPhase.value === 'polling') {
        swapProgress.value = db.tacoStatus
        const step = db.tacoStatus.step

        if ('Complete' in step) {
          uiPhase.value = 'success'
          orderHistory.value = db.recentTacoOrders
          maybeStopPolling()
          return
        }

        if ('Failed' in step && db.tacoStatus.retryCount >= BigInt(MAX_RETRIES)) {
          uiPhase.value = 'error'
          orderError.value = progressErrorMessage.value
            || 'Swap failed after multiple retries. Use the manual Claim button or contact support.'
          maybeStopPolling()
          return
        }
      }

      // --- Update NACHOS ---
      if (nachosPhase.value === 'polling') {
        nachosProgress.value = db.nachosStatus
        const step = db.nachosStatus.step

        if ('Complete' in step) {
          nachosPhase.value = 'success'
          nachosOrderHistory.value = db.recentNachosOrders
          maybeStopPolling()
          return
        }

        if ('Failed' in step && !db.hasPendingNachos) {
          nachosPhase.value = 'error'
          nachosError.value = nachosProgressError.value
            || 'Mint failed. Use the manual Claim button or contact support.'
          maybeStopPolling()
          return
        }
      }
    } catch (err) {
      console.error('Error polling swap dashboard:', err)
    }
  }, intervalMs)
}

/** Stop the unified poll if neither TACO nor NACHOS needs it */
const maybeStopPolling = () => {
  if (uiPhase.value !== 'polling' && nachosPhase.value !== 'polling') {
    stopUnifiedPolling()
  }
}

/** Stop the unified polling interval */
const stopUnifiedPolling = () => {
  if (unifiedPollInterval) {
    clearInterval(unifiedPollInterval)
    unifiedPollInterval = null
    currentPollRate = 0
  }
}

// ==========================
// Dashboard loading (single call replaces multiple)
// ==========================

/**
 * Load all swap data from a single getSwapDashboard() query.
 * Populates addresses, orders, config, subaccounts, and evaluates phase state.
 * KEY BUG FIX: If no active lock AND no pending retry, treat stale
 * WaitingForDeposit/NotStarted as idle (don't resume).
 */
const loadDashboard = async () => {
  tacoAddrError.value = false
  nachosAddrError.value = false

  try {
    const actor = await tacoStore.createTacoSwapActor()
    const db: SwapDashboard = await (actor as any).getSwapDashboard()

    // --- Populate addresses ---
    depositAddress.value = db.depositAddress
    nachosDepositAddress.value = db.nachosDepositAddress

    // --- Populate pending deposit flags ---
    hasPendingTacoDeposit.value = db.hasPendingTaco
    hasPendingNachosDeposit.value = db.hasPendingNachos

    // --- Populate config ---
    systemPaused.value = db.config.systemPaused

    // --- Populate orders ---
    orderHistory.value = db.recentTacoOrders
    nachosOrderHistory.value = db.recentNachosOrders

    // --- Populate deposit subaccounts for ledger polling ---
    tacoDepositSubaccount.value = db.tacoDepositSubaccount instanceof Uint8Array
      ? db.tacoDepositSubaccount
      : new Uint8Array(db.tacoDepositSubaccount)
    nachosDepositSubaccount.value = db.nachosDepositSubaccount instanceof Uint8Array
      ? db.nachosDepositSubaccount
      : new Uint8Array(db.nachosDepositSubaccount)

    // --- TACO phase evaluation ---
    const tacoStep = db.tacoStatus.step
    const tacoIsNotStarted = 'NotStarted' in tacoStep
    const tacoIsComplete = 'Complete' in tacoStep
    const tacoIsWaiting = 'WaitingForDeposit' in tacoStep
    const tacoIsFailed = 'Failed' in tacoStep
    const tacoTerminal = tacoIsFailed && db.tacoStatus.retryCount >= BigInt(MAX_RETRIES)

    // Stale = no lock, no pending retry, and still just waiting/not started
    const tacoIsStale = !db.hasActiveLock && !db.hasPendingTaco
      && (tacoIsNotStarted || tacoIsWaiting)

    if (tacoIsStale) {
      // Do nothing — leave uiPhase as 'idle'
    } else if (tacoIsComplete) {
      const updatedMs = Number(db.tacoStatus.updatedAt / 1_000_000n)
      if (Date.now() - updatedMs < 300_000) {
        swapProgress.value = db.tacoStatus
        uiPhase.value = 'success'
      }
    } else if (tacoTerminal) {
      swapProgress.value = db.tacoStatus
      uiPhase.value = 'error'
      orderError.value = db.tacoStatus.errorMessage.length > 0
        ? (db.tacoStatus.errorMessage[0] as string)
        : 'Swap failed. Use the manual Claim button.'
    } else if (tacoIsFailed && db.hasPendingTaco) {
      swapProgress.value = db.tacoStatus
      uiPhase.value = 'polling'
      startUnifiedPolling(POLL_PENDING_MS)
    } else if (tacoIsWaiting && db.hasActiveLock) {
      // Genuinely active WaitingForDeposit — poll ledger for ICP arrival
      swapProgress.value = db.tacoStatus
      uiPhase.value = 'polling'
      startDepositPolling('taco')
    } else if (!tacoIsNotStarted && !tacoIsWaiting) {
      // Past deposit phase (DepositReceived, GettingQuote, etc.) — poll swap state
      swapProgress.value = db.tacoStatus
      uiPhase.value = 'polling'
      startUnifiedPolling(POLL_ACTIVE_MS)
    }

    // --- NACHOS phase evaluation ---
    const nachosStep = db.nachosStatus.step
    const nachosIsNotStarted = 'NotStarted' in nachosStep
    const nachosIsWaiting = 'WaitingForDeposit' in nachosStep
    const nachosIsComplete_ = 'Complete' in nachosStep
    const nachosIsFailed_ = 'Failed' in nachosStep

    const nachosIsStale = !db.hasActiveLock && !db.hasPendingNachos
      && (nachosIsNotStarted || nachosIsWaiting)

    if (nachosIsStale) {
      // Idle
    } else if (nachosIsComplete_) {
      const updatedMs = Number(db.nachosStatus.updatedAt / 1_000_000n)
      if (Date.now() - updatedMs < 300_000) {
        nachosProgress.value = db.nachosStatus
        nachosPhase.value = 'success'
      }
    } else if (nachosIsFailed_ && !db.hasPendingNachos) {
      nachosProgress.value = db.nachosStatus
      nachosPhase.value = 'error'
      nachosError.value = db.nachosStatus.errorMessage.length > 0
        ? (db.nachosStatus.errorMessage[0] as string)
        : 'Mint failed. Use the manual Claim button.'
    } else if (nachosIsFailed_ && db.hasPendingNachos) {
      nachosProgress.value = db.nachosStatus
      nachosPhase.value = 'polling'
      selectedProduct.value = 'nachos'
      startUnifiedPolling(POLL_PENDING_MS)
    } else if (nachosIsWaiting && db.hasActiveLock) {
      // Genuinely active WaitingForDeposit — poll ledger
      nachosProgress.value = db.nachosStatus
      nachosPhase.value = 'polling'
      selectedProduct.value = 'nachos'
      startDepositPolling('nachos')
    } else if (!nachosIsNotStarted && !nachosIsWaiting) {
      // Past deposit phase — poll swap state
      nachosProgress.value = db.nachosStatus
      nachosPhase.value = 'polling'
      selectedProduct.value = 'nachos'
      startUnifiedPolling(POLL_ACTIVE_MS)
    }
  } catch (err) {
    console.error('Failed to load swap dashboard:', err)
    if (!depositAddress.value) tacoAddrError.value = true
    if (!nachosDepositAddress.value) nachosAddrError.value = true
  }
}

/**
 * Refresh only order history from the dashboard.
 * Called after successful claims — does NOT re-evaluate phase state.
 */
const refreshOrders = async () => {
  try {
    const actor = await tacoStore.createTacoSwapActor()
    const db: SwapDashboard = await (actor as any).getSwapDashboard()
    orderHistory.value = db.recentTacoOrders
    nachosOrderHistory.value = db.recentNachosOrders
  } catch (err) {
    console.error('Failed to refresh orders:', err)
  }
}

/** Handle a ClaimResult from the canister — returns true if swap is done */
const handleClaimResult = (result: any): boolean => {
  if ('Success' in result) {
    const { tacoAmount, txId } = result.Success
    uiPhase.value = 'success'
    claimResult.value = {
      success: true,
      message: `Received ${formatE8s(tacoAmount)} TACO! (tx: ${txId})`
    }
    refreshOrders().catch(console.error)
    return true
  }
  if ('NoDeposit' in result) {
    return false
  }
  if ('AlreadyProcessing' in result) {
    return false
  }
  if ('BelowMinimum' in result) {
    const { balance, minimum } = result.BelowMinimum
    uiPhase.value = 'error'
    orderError.value = `Deposit too small: ${formatE8s(balance)} ICP (min: ${formatE8s(minimum)} ICP)`
    return true
  }
  if ('SwapFailed' in result) {
    orderError.value = `Swap failed: ${result.SwapFailed}. Will auto-retry in 5 minutes.`
    return false
  }
  if ('SystemPaused' in result) {
    uiPhase.value = 'error'
    orderError.value = 'System is paused for maintenance. Your ICP is safe and will be processed when resumed.'
    return true
  }
  if ('RateLimited' in result) {
    return false
  }
  if ('NotAuthorized' in result) {
    uiPhase.value = 'error'
    orderError.value = 'Not authorized. Please log in again.'
    return true
  }
  return false
}

/** Handle a NachosClaimResult — returns true if terminal (success/error) */
const handleNachosClaimResult = (result: any): boolean => {
  if ('Success' in result) {
    const { nachosAmount, mintId, orderId: oid } = result.Success
    nachosPhase.value = 'success'
    claimResult.value = {
      success: true,
      message: `Received ${formatE8s(nachosAmount)} NACHOS! (mint: ${mintId}, order: ${oid})`
    }
    refreshOrders().catch(console.error)
    return true
  }
  if ('NoDeposit' in result) return false
  if ('AlreadyProcessing' in result) return false
  if ('BelowMinimum' in result) {
    const { balance, minimum } = result.BelowMinimum
    nachosPhase.value = 'error'
    nachosError.value = `Deposit too small: ${formatE8s(balance)} ICP (min: ${formatE8s(minimum)} ICP)`
    return true
  }
  if ('MintFailed' in result) {
    nachosError.value = `Mint failed: ${result.MintFailed}. Will auto-retry.`
    return false
  }
  if ('SystemPaused' in result) {
    nachosPhase.value = 'error'
    nachosError.value = 'System paused. Your ICP is safe.'
    return true
  }
  if ('RateLimited' in result) return false
  if ('NotAuthorized' in result) {
    nachosPhase.value = 'error'
    nachosError.value = 'Not authorized. Please log in again.'
    return true
  }
  return false
}

// ==========================
// Phase 1: Deposit polling via ICP ledger icrc1_balance_of
// ==========================

/** Poll ICP ledger for deposit balance. Conditional behavior based on autoSwapEnabled. */
const startDepositPolling = (product: Product) => {
  stopDepositPolling()
  const startedAt = Date.now()
  const swapCanisterId = tacoStore.tacoSwapCanisterId()

  depositPollInterval = setInterval(async () => {
    // Timeout guard
    if (Date.now() - startedAt > MAX_POLL_DURATION_MS) {
      stopDepositPolling()
      if (product === 'taco' && uiPhase.value === 'polling') {
        uiPhase.value = 'error'
        orderError.value = 'Timed out waiting for ICP deposit.'
      }
      if (product === 'nachos' && nachosPhase.value === 'polling') {
        nachosPhase.value = 'error'
        nachosError.value = 'Timed out waiting for ICP deposit.'
      }
      return
    }

    try {
      let balanceBigInt: bigint

      if (autoSwapEnabled.value) {
        // AUTO MODE: Poll swap deposit address (old behavior)
        const subaccount = product === 'taco'
          ? tacoDepositSubaccount.value
          : nachosDepositSubaccount.value

        if (!subaccount) return

        const balance = await tacoStore.icrc1BalanceOf(
          ICP_LEDGER_CANISTER_ID,
          Principal.fromText(swapCanisterId),
          subaccount
        )

        if (balance === false) return // query error, retry next tick
        balanceBigInt = BigInt(balance)

        // Update live balance for UI
        if (product === 'taco') {
          depositBalance.value = balanceBigInt
        } else {
          nachosDepositBalance.value = balanceBigInt
        }

        // Auto-swap when detected
        if (balanceBigInt > DEPOSIT_MIN_E8S) {
          stopDepositPolling()

          const actor = await tacoStore.createTacoSwapActor()

          if (product === 'taco') {
            uiPhase.value = 'polling'
            const result = await (actor as any).claim_taco([fiatAmount.value], [fiatCurrency.value])
            const done = handleClaimResult(result)
            if (!done && uiPhase.value === 'polling') {
              startUnifiedPolling(POLL_ACTIVE_MS)
            }
          } else {
            nachosPhase.value = 'polling'
            const result = await (actor as any).claim_nachos(0n, [fiatAmount.value], [fiatCurrency.value])
            const done = handleNachosClaimResult(result)
            if (!done && nachosPhase.value === 'polling') {
              startUnifiedPolling(POLL_ACTIVE_MS)
            }
          }
        }
      } else {
        // MANUAL MODE: Poll user's personal wallet for DIFFERENCE
        const currentBalance = await tacoStore.icrc1BalanceOf(
          ICP_LEDGER_CANISTER_ID,
          Principal.fromText(tacoStore.userPrincipal),
          undefined  // User's default subaccount
        )

        if (currentBalance === false) return // query error, retry next tick
        const currentBalanceBigInt = BigInt(currentBalance)

        // Calculate the difference from baseline
        const balanceDifference = currentBalanceBigInt - baselineIcpBalance.value

        // Update display balance with difference
        if (product === 'taco') {
          depositBalance.value = balanceDifference
        } else {
          nachosDepositBalance.value = balanceDifference
        }

        // ICP detected when difference exceeds minimum
        if (balanceDifference > DEPOSIT_MIN_E8S) {
          stopDepositPolling()

          // Set flags to show manual swap button
          icpDetected.value = true
          detectedIcpAmount.value = balanceDifference  // Use DIFFERENCE, not total

          // Return UI to idle (manual swap button appears)
          if (product === 'taco') {
            uiPhase.value = 'idle'
          } else {
            nachosPhase.value = 'idle'
          }
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

/** Execute manual swap: transfer ICP from user wallet → swap canister, then claim */
const executeManualSwap = async () => {
  if (!icpDetected.value || detectedIcpAmount.value === 0n) {
    console.error('No ICP detected to swap')
    return
  }

  const product = selectedProduct.value

  try {
    // Set UI to processing state
    if (product === 'taco') {
      uiPhase.value = 'polling'
      orderError.value = null
    } else {
      nachosPhase.value = 'polling'
      nachosError.value = null
    }

    // Step 1: Transfer ICP from user's wallet to swap canister deposit address
    const swapCanisterId = tacoStore.tacoSwapCanisterId()
    const subaccount = product === 'taco'
      ? tacoDepositSubaccount.value
      : nachosDepositSubaccount.value

    if (!subaccount) {
      throw new Error('Deposit subaccount not available')
    }

    // Create ICP ledger actor for transfer
    const authClient = await AuthClient.create({ keyType: 'Ed25519' })
    const identity = authClient.getIdentity()

    const network = getEffectiveNetwork()
    const networkHost = network === 'ic' ? 'https://ic0.app' : 'https://icp0.io'

    const agent = await HttpAgent.create({
      identity,
      host: networkHost,
      shouldFetchRootKey: network !== 'ic'
    })

    if (network !== 'ic') {
      await agent.fetchRootKey()
    }

    // ICRC1 IDL for transfer
    const icrc1IDL = ({ IDL }: any) => {
      return IDL.Service({
        'icrc1_transfer': IDL.Func(
          [IDL.Record({
            'to': IDL.Record({ 'owner': IDL.Principal, 'subaccount': IDL.Opt(IDL.Vec(IDL.Nat8)) }),
            'fee': IDL.Opt(IDL.Nat),
            'memo': IDL.Opt(IDL.Vec(IDL.Nat8)),
            'from_subaccount': IDL.Opt(IDL.Vec(IDL.Nat8)),
            'created_at_time': IDL.Opt(IDL.Nat64),
            'amount': IDL.Nat
          })],
          [IDL.Variant({ 'Ok': IDL.Nat, 'Err': IDL.Unknown })],
          []
        )
      })
    }

    const icpLedger = Actor.createActor(icrc1IDL, { agent, canisterId: ICP_LEDGER_CANISTER_ID })

    const transferArgs = {
      to: {
        owner: Principal.fromText(swapCanisterId),
        subaccount: [Array.from(subaccount instanceof Uint8Array ? subaccount : new Uint8Array(subaccount))]
      },
      amount: detectedIcpAmount.value,
      fee: [],
      memo: [],
      from_subaccount: [],
      created_at_time: []
    }

    const transferResult: any = await icpLedger.icrc1_transfer(transferArgs)

    // Check transfer succeeded
    if ('Err' in transferResult) {
      throw new Error(`ICP transfer failed: ${JSON.stringify(transferResult.Err)}`)
    }

    // Step 2: Now call claim functions (ICP is in deposit address)
    const actor = await tacoStore.createTacoSwapActor()

    if (product === 'taco') {
      const result = await (actor as any).claim_taco([fiatAmount.value], [fiatCurrency.value])
      const done = handleClaimResult(result)
      if (!done && uiPhase.value === 'polling') {
        // Claim accepted but still processing — switch to Phase 2 (swap polling)
        startUnifiedPolling(POLL_ACTIVE_MS)
      }
    } else {
      const result = await (actor as any).claim_nachos(0n, [fiatAmount.value], [fiatCurrency.value])
      const done = handleNachosClaimResult(result)
      if (!done && nachosPhase.value === 'polling') {
        startUnifiedPolling(POLL_ACTIVE_MS)
      }
    }

    // Reset ICP detected state
    icpDetected.value = false
    detectedIcpAmount.value = 0n

  } catch (err) {
    console.error('Manual swap failed:', err)
    if (product === 'taco') {
      uiPhase.value = 'error'
      orderError.value = err instanceof Error ? err.message : 'Manual swap failed'
    } else {
      nachosPhase.value = 'error'
      nachosError.value = err instanceof Error ? err.message : 'Manual swap failed'
    }
  }
}

/** Manual claim — TACO fallback */
const claimTaco = async () => {
  claiming.value = true
  claimResult.value = null

  try {
    const actor = await tacoStore.createTacoSwapActor()
    const result = await (actor as any).claim_taco([fiatAmount.value], [fiatCurrency.value])

    if ('Success' in result) {
      const { tacoAmount, txId } = result.Success
      claimResult.value = {
        success: true,
        message: `Claimed ${formatE8s(tacoAmount)} TACO! (tx: ${txId})`
      }
      refreshOrders().catch(console.error)
    } else if ('NoDeposit' in result) {
      claimResult.value = {
        success: false,
        message: 'No pending ICP found. If you recently paid, please wait a few minutes for the ICP to arrive.'
      }
    } else if ('BelowMinimum' in result) {
      const { balance, minimum } = result.BelowMinimum
      claimResult.value = {
        success: false,
        message: `Deposit too small: ${formatE8s(balance)} ICP (minimum: ${formatE8s(minimum)} ICP)`
      }
    } else if ('SwapFailed' in result) {
      claimResult.value = {
        success: false,
        message: `Swap failed: ${result.SwapFailed}. The canister will auto-retry.`
      }
    } else if ('AlreadyProcessing' in result) {
      claimResult.value = {
        success: false,
        message: 'A swap is already in progress for your account. Please wait a moment.'
      }
    } else if ('SystemPaused' in result) {
      claimResult.value = {
        success: false,
        message: 'System is paused for maintenance. Your ICP is safe and will be processed when resumed.'
      }
    } else if ('RateLimited' in result) {
      claimResult.value = {
        success: false,
        message: 'Too many requests. Please wait a minute before trying again.'
      }
    } else if ('NotAuthorized' in result) {
      claimResult.value = {
        success: false,
        message: 'Not authorized. Please log in and try again.'
      }
    }
  } catch (err: any) {
    claimResult.value = {
      success: false,
      message: `Claim error: ${err.message || err}`
    }
  } finally {
    claiming.value = false
  }
}

// ==========================
// NACHOS functions
// ==========================

const nachosAddrError = ref(false)

/** Open Coinbase Onramp popup (NACHOS — uses nachosDepositAddress) */
const openCoinbaseNachos = async () => {
  if (!nachosDepositAddress.value) {
    nachosError.value = 'NACHOS deposit address not loaded. Please refresh and try again.'
    nachosPhase.value = 'error'
    return
  }

  nachosPhase.value = 'registering'
  nachosError.value = null
  claimResult.value = null
  nachosProgress.value = null
  icpDetected.value = false
  detectedIcpAmount.value = 0n

  // Capture baseline ICP balance (for difference tracking in manual mode)
  if (!autoSwapEnabled.value) {
    try {
      baselineIcpBalance.value = await tacoStore.icrc1BalanceOf(
        ICP_LEDGER_CANISTER_ID,
        Principal.fromText(tacoStore.userPrincipal),
        undefined  // User's default subaccount
      )
    } catch (e) {
      console.warn('Failed to capture baseline balance:', e)
      baselineIcpBalance.value = 0n
    }
  }

  try {
    // Use user's personal wallet in manual mode, NACHOS deposit address in auto mode
    const targetAddress = autoSwapEnabled.value ? nachosDepositAddress.value : userLedgerAccountId.value

    // 1. Get session token from CF Worker (signed with frontend identity)
    const sessionBody = {
      addresses: [{ address: targetAddress }],
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

    // 2. Generate Coinbase onramp URL
    const { generateOnRampURL } = await import('@coinbase/cbpay-js')

    const onrampUrl = generateOnRampURL({
      sessionToken,
      addresses: { [targetAddress]: [] },
      assets: ['ICP'],
      presetFiatAmount: Number(fiatAmount.value) || 50,
      theme: 'dark',
    })

    // 3. Open popup + start Phase 1 NACHOS deposit polling (ICP ledger)
    nachosPhase.value = 'polling'
    nachosStartTime.value = Date.now()
    nachosElapsed.value = 0
    startElapsedTimer()
    const popup = window.open(onrampUrl, 'coinbase-onramp', 'width=500,height=700,scrollbars=yes,resizable=yes')
    startDepositPolling('nachos')

    // 4. When popup closes — grace period
    const popupPoll = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(popupPoll)
        handlePopupClose(nachosProgress, nachosPhase, () => {
          nachosProgress.value = null
        })
      }
    }, 1500)

  } catch (err: any) {
    console.error('Failed to open Coinbase Onramp (NACHOS):', err)
    nachosPhase.value = 'error'
    nachosError.value = `Failed to open payment widget: ${err.message || err}`
  }
}

/** Open the Transak widget (NACHOS) */
const openTransakNachos = async () => {
  if (!nachosDepositAddress.value) {
    nachosError.value = 'NACHOS deposit address not loaded. Please refresh and try again.'
    nachosPhase.value = 'error'
    return
  }

  nachosPhase.value = 'registering'
  nachosError.value = null
  claimResult.value = null
  nachosProgress.value = null

  try {
    nachosPhase.value = 'polling'
    nachosStartTime.value = Date.now()
    nachosElapsed.value = 0
    startElapsedTimer()

    const { Transak } = await import('@transak/ui-js-sdk')

    const widgetUrl = buildTransakUrl(nachosDepositAddress.value, 'Buy NACHOS')
    transakInstance = new Transak({ widgetUrl })
    transakInstance.init()

    startDepositPolling('nachos')

    Transak.on(Transak.EVENTS.TRANSAK_ORDER_CREATED, (data: any) => {
      console.log('Transak order created (NACHOS):', data)
    })

    Transak.on(Transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, (data: any) => {
      console.log('Transak order successful (NACHOS):', data)
    })

    Transak.on(Transak.EVENTS.TRANSAK_WIDGET_CLOSE, () => {
      console.log('Transak widget closed (NACHOS)')
      if (transakInstance) {
        transakInstance.close()
        transakInstance = null
      }
      handlePopupClose(nachosProgress, nachosPhase, () => {
        nachosProgress.value = null
      })
    })

  } catch (err: any) {
    console.error('Failed to initialize Transak (NACHOS):', err)
    nachosPhase.value = 'error'
    nachosError.value = `Failed to open payment widget: ${err.message || err}`
  }
}

/** Manual claim — NACHOS fallback */
const claimNachos = async () => {
  claiming.value = true
  claimResult.value = null

  try {
    const actor = await tacoStore.createTacoSwapActor()
    const result = await (actor as any).claim_nachos(0n, [fiatAmount.value], [fiatCurrency.value])

    const done = handleNachosClaimResult(result)

    // For manual claim, also set user-facing claimResult messages for non-terminal cases
    if (!done) {
      if ('NoDeposit' in result) {
        claimResult.value = {
          success: false,
          message: 'No pending ICP found. If you recently paid, please wait a few minutes for the ICP to arrive.'
        }
      } else if ('AlreadyProcessing' in result) {
        claimResult.value = {
          success: false,
          message: 'A mint is already in progress for your account. Please wait a moment.'
        }
      } else if ('RateLimited' in result) {
        claimResult.value = {
          success: false,
          message: 'Too many requests. Please wait a minute before trying again.'
        }
      }
    }
  } catch (err: any) {
    claimResult.value = {
      success: false,
      message: `Claim error: ${err.message || err}`
    }
  } finally {
    claiming.value = false
  }
}

/////////////////////
// lifecycle hooks //
/////////////////////

onMounted(async () => {
  // redirect to home on production (unless admin)
  if (!isDevEnvironment() && !isAdmin.value) {
    router.replace('/')
    return
  }

  // load config (anonymous — works without login)
  loadConfig().catch(console.error)

  // if already logged in, load all swap data in one call
  if (tacoStore.userLoggedIn) {
    loadDashboard().catch(console.error)
  }
})

// when user logs in after page load, fetch their data
watch(userLoggedIn, (loggedIn) => {
  if (loggedIn) {
    loadDashboard().catch(console.error)
  } else {
    depositAddress.value = ''
    nachosDepositAddress.value = ''
    orderHistory.value = []
    nachosOrderHistory.value = []
    swapProgress.value = null
    nachosProgress.value = null
    uiPhase.value = 'idle'
    nachosPhase.value = 'idle'
    stopDepositPolling()
    stopUnifiedPolling()
  }
})

onBeforeUnmount(() => {
  stopDepositPolling()
  stopUnifiedPolling()
  stopElapsedTimer()
  if (transakInstance && typeof transakInstance.close === 'function') {
    transakInstance.close()
  }
  transakInstance = null
})

</script>
