<template>
  <div class="token-table-wrapper">
    <table class="token-table">
      <thead>
        <tr>
          <th style="width: 60px;"></th>
          <th>Token</th>
          <th class="text-end">Balance</th>
          <th class="text-end">Value</th>
          <th class="text-end">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="token in tokens" :key="token.principal" class="token-row">
          <!-- Logo -->
          <td>
            <img :src="token.logo" :alt="token.symbol" class="token-logo" />
          </td>

          <!-- Token Info -->
          <td>
            <div class="token-info">
              <span class="token-symbol">{{ token.symbol }}</span>
              <span class="token-name">{{ token.name }}</span>
            </div>
          </td>

          <!-- Balance -->
          <td class="text-end">
            <span class="token-balance">
              {{ formatBalance(token.balance, token.decimals) }}
            </span>
          </td>

          <!-- USD Value -->
          <td class="text-end">
            <span class="token-usd" v-if="token.priceUSD">
              ${{ formatUSD(token.balance, token.decimals, token.priceUSD) }}
            </span>
            <span class="token-usd-unavailable" v-else>—</span>
          </td>

          <!-- Actions -->
          <td class="text-end">
            <div class="token-actions">
              <!-- NACHOS: Mint button (goes to vault) -->
              <button
                v-if="token.symbol === 'NACHOS'"
                class="btn btn-sm taco-btn taco-btn--green"
                @click="$router.push('/vault')"
                title="Mint NACHOS">
                <i class="fa fa-coins"></i>
                <span class="action-label">Mint</span>
              </button>
              <!-- Other tokens: Swap button -->
              <button
                v-else
                class="btn btn-sm taco-btn taco-btn--green"
                @click="$emit('swap', token)"
                title="Swap">
                <i class="fa fa-exchange-alt"></i>
                <span class="action-label">Swap</span>
              </button>
              <button
                class="btn btn-sm taco-btn taco-btn--green"
                @click="$emit('send', token)"
                title="Send">
                <i class="fa fa-paper-plane"></i>
                <span class="action-label">Send</span>
              </button>
              <button
                v-if="showUnregister"
                class="btn btn-sm taco-btn taco-btn--danger"
                @click="$emit('unregister', token)"
                title="Unregister Token">
                <i class="fa fa-times"></i>
                <span class="action-label">Remove</span>
              </button>
            </div>
          </td>
        </tr>

        <!-- Empty State -->
        <tr v-if="tokens.length === 0" class="empty-row">
          <td colspan="5" class="text-center empty-message">
            <i class="fa fa-coins fa-2x mb-2" style="opacity: 0.4;"></i>
            <p class="mb-0">No tokens to display</p>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

// Props
interface WalletToken {
  principal: string
  name: string
  symbol: string
  logo: string
  balance: bigint
  decimals: number
  fee: bigint
  priceUSD?: number
  isRegistered?: boolean
}

interface Props {
  tokens: WalletToken[]
  showUnregister?: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  send: [token: WalletToken]
  swap: [token: WalletToken]
  unregister: [token: WalletToken]
}>()

// Format balance (BigInt to readable decimal)
function formatBalance(balance: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals)
  const integerPart = balance / divisor
  const fractionalPart = balance % divisor

  // Convert fractional part to string with leading zeros
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0')

  // Trim trailing zeros and decimal point if not needed
  const trimmedFractional = fractionalStr.replace(/0+$/, '')

  if (trimmedFractional === '') {
    return integerPart.toString()
  }

  // Show max 4 decimal places for display
  const displayFractional = trimmedFractional.substring(0, 4)

  return `${integerPart}.${displayFractional}`
}

// Format USD value
function formatUSD(balance: bigint, decimals: number, priceUSD: number): string {
  const divisor = BigInt(10 ** decimals)
  const balanceNum = Number(balance) / Number(divisor)
  const usdValue = balanceNum * priceUSD

  if (usdValue < 0.01) {
    return '< 0.01'
  }

  return usdValue.toFixed(2)
}
</script>

<style scoped lang="scss">
.token-table-wrapper {
  background: rgba(0, 0, 0, 0.25); // MUCH DARKER - increased from 0.12 to 0.25
  border-radius: 0.375rem;
  padding: 0.75rem; // Increased from 0.5rem
  overflow-x: auto;
}

.token-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Space Mono', monospace;
  font-size: 0.9rem; // Increased from 0.8rem

  th, td {
    padding: 0.625rem 0.75rem; // Increased from 0.375rem 0.5rem
    border-bottom: 1px solid var(--dark-orange-to-brown);
    vertical-align: middle; // Center content vertically
  }

  th {
    font-size: 0.8rem; // Increased from 0.75rem
    text-transform: uppercase;
    opacity: 0.85;
    font-weight: 600;
    border-bottom: 2px solid var(--dark-orange-to-brown);
    color: var(--brown-to-white);
    padding-top: 0.5rem; // Extra top padding for headers
    padding-bottom: 0.75rem; // Extra bottom padding for headers
  }

  td {
    color: var(--black-to-white);
  }

  tbody tr:last-child td {
    border-bottom: none;
  }
}

.token-row {
  transition: background-color 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.15); // MUCH DARKER - increased from 0.08 to 0.15
  }
}

.token-logo {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: block;
}

.token-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.2rem;
}

.token-symbol {
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--black-to-white);
}

.token-name {
  font-size: 0.8rem; // Increased from 0.7rem
  opacity: 0.7;
  color: var(--black-to-white);
}

.token-balance {
  font-weight: 600;
  font-size: 0.95rem; // Increased from 0.85rem
  color: var(--black-to-white);
}

.token-usd {
  opacity: 0.8;
  font-size: 0.85rem; // Increased from 0.75rem
  color: var(--black-to-white);
}

.token-usd-unavailable {
  opacity: 0.4;
  font-size: 0.85rem; // Increased from 0.75rem
  color: var(--black-to-white);
}

.token-actions {
  display: flex;
  gap: 0.375rem;
  justify-content: flex-end;
  flex-wrap: wrap;

  .btn {
    padding: 0.375rem 0.625rem; // Increased from 0.25rem 0.5rem
    font-size: 0.8rem; // Increased from 0.7rem
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 0.25rem;

    i {
      font-size: 0.75rem; // Increased from 0.7rem
    }

    .action-label {
      display: inline;
    }
  }
}

.empty-row {
  td {
    padding: 2rem 1rem;
  }
}

.empty-message {
  opacity: 0.6;
  font-size: 0.85rem;

  i {
    display: block;
    margin-bottom: 0.5rem;
  }

  p {
    margin: 0;
  }
}

// Mobile responsive
@media (max-width: 767.98px) {
  .token-table {
    font-size: 0.7rem;

    th, td {
      padding: 0.25rem 0.375rem;
    }

    th {
      font-size: 0.65rem;
    }
  }

  .token-logo {
    width: 40px;
    height: 40px;
  }

  .token-symbol {
    font-size: 0.85rem;
  }

  .token-name {
    font-size: 0.65rem;
  }

  .token-balance {
    font-size: 0.75rem;
  }

  .token-usd {
    font-size: 0.65rem;
  }

  .token-actions {
    flex-direction: column;
    gap: 0.25rem;

    .btn {
      padding: 0.25rem 0.375rem;
      font-size: 0.65rem;
      width: 100%;
      justify-content: center;

      .action-label {
        display: none;
      }
    }
  }
}

// Extra small screens - hide action labels
@media (max-width: 575.98px) {
  .token-actions .btn .action-label {
    display: none;
  }
}
</style>
