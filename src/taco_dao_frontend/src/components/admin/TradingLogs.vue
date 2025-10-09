<!-- TradingLogs.vue -->
<template>
    <div class="trading-logs">
        <h3>Trading Logs</h3>
        <div class="log-container">
            <div v-for="log in sortedLogs" :key="log.timestamp" class="log-entry">
                <div class="log-timestamp">{{ formatTimestamp(log.timestamp) }}</div>
                <div class="log-message">
                    <template v-if="log.tokens">
                        <div class="token-trade">
                            <div class="token-info">
                                <img v-if="getTokenInfo(log.tokens.sold.symbol)?.tokenIcon" 
                                     :src="getTokenInfo(log.tokens.sold.symbol)?.tokenIcon" 
                                     class="token-icon" 
                                     :alt="log.tokens.sold.symbol">
                                <span>{{ formatAmount(log.tokens.sold.amount, log.tokens.sold.decimals) }}</span>
                                <a :href="getTokenInfo(log.tokens.sold.symbol)?.tokenLink" 
                                   target="_blank" 
                                   class="token-symbol">{{ log.tokens.sold.symbol }}</a>
                            </div>
                            <div class="trade-arrow">→</div>
                            <div class="token-info">
                                <img v-if="getTokenInfo(log.tokens.bought.symbol)?.tokenIcon" 
                                     :src="getTokenInfo(log.tokens.bought.symbol)?.tokenIcon" 
                                     class="token-icon" 
                                     :alt="log.tokens.bought.symbol">
                                <span>{{ formatAmount(log.tokens.bought.amount, log.tokens.bought.decimals) }}</span>
                                <a :href="getTokenInfo(log.tokens.bought.symbol)?.tokenLink" 
                                   target="_blank" 
                                   class="token-symbol">{{ log.tokens.bought.symbol }}</a>
                                <div class="exchange-info" v-if="log.exchange">
                                    on {{ log.exchange }}
                                </div>
                            </div>
                        </div>
                    </template>
                    <template v-else>
                        {{ log.message }}
                    </template>
                </div>
            </div>
            <div v-if="!sortedLogs.length" class="no-logs">
                No trading logs available
            </div>
        </div>
    </div>
</template>

<style scoped>
.trading-logs {
    background: var(--light-orange-to-brown);
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
}

h3 {
    color: var(--white-to-black);
    margin-top: 0;
    margin-bottom: 15px;
}

.log-container {
    max-height: 400px;
    overflow-y: auto;
    background: var(--black-to-white);
    border-radius: 4px;
    padding: 10px;
}

.log-entry {
    padding: 8px;
    border-bottom: 1px solid var(--light-gray);
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.log-entry:last-child {
    border-bottom: none;
}

.log-timestamp {
    font-size: 0.8em;
    color: var(--dark-gray);
}

.log-message {
    color: var(--black);
    word-break: break-word;
}

.token-trade {
    display: flex;
    align-items: center;
    gap: 10px;
}

.token-info {
    display: flex;
    align-items: center;
    gap: 6px;
}

.token-icon {
    width: 20px;
    height: 20px;
    border-radius: 50%;
}

.trade-arrow {
    color: var(--dark-gray);
    font-size: 1.2em;
}

.token-symbol {
    color: var(--blue);
    text-decoration: none;
    font-weight: 500;
}

.token-symbol:hover {
    text-decoration: underline;
}

.exchange-info {
    font-size: 0.8em;
    color: var(--dark-gray);
}

.no-logs {
    text-align: center;
    padding: 20px;
    color: var(--dark-gray);
    font-style: italic;
}
</style> 

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useTacoStore } from '../../stores/taco.store'
import { storeToRefs } from 'pinia'
import { tokenData } from '../data/TokenData'

const store = useTacoStore()
const { tradingLogs, fetchedTokenDetails } = storeToRefs(store)
const { ensureTokenDetails } = store

const sortedLogs = computed(() => {
    return [...tradingLogs.value].sort((a, b) => {
        // Use proper BigInt comparison that returns a number
        return Number(b.timestamp > a.timestamp) - Number(b.timestamp < a.timestamp)
    }).map(log => {
        // Handle both formats:
        // 1. "0.02 ICP → 0.00143454 SNEED on ICPSwap"
        // 2. "Sold X TOKEN_A for Y TOKEN_B on KongSwap"
        const arrowMatch = log.message.match(/([\d.]+) (\w+) → ([\d.]+) (\w+) on (\w+)/)
        const soldMatch = log.message.match(/Sold ([\d.]+) (\w+) for ([\d.]+) (\w+) on (\w+)/)
        
        if (arrowMatch || soldMatch) {
            const match = arrowMatch || soldMatch
            const [_, soldAmount, soldSymbol, boughtAmount, boughtSymbol, exchange] = match
            
            // Find token details from fetchedTokenDetails
            const soldToken = fetchedTokenDetails.value.find(t => t[1].tokenSymbol === soldSymbol)?.[1]
            const boughtToken = fetchedTokenDetails.value.find(t => t[1].tokenSymbol === boughtSymbol)?.[1]
            
            return {
                ...log,
                exchange,
                tokens: {
                    sold: {
                        symbol: soldSymbol,
                        amount: soldAmount,
                        decimals: soldToken?.tokenDecimals || 8
                    },
                    bought: {
                        symbol: boughtSymbol,
                        amount: boughtAmount,
                        decimals: boughtToken?.tokenDecimals || 8
                    }
                }
            }
        }
        return log
    })
})

const formatTimestamp = (timestamp: bigint) => {
    // Convert BigInt nanoseconds to milliseconds as a regular number
    const milliseconds = Number(timestamp / BigInt(1_000_000))
    const date = new Date(milliseconds)
    return date.toLocaleString()
}

const formatAmount = (amount: string | bigint, decimals: number | bigint) => {
    try {
        let strAmount: string;
        // Convert decimals to number to ensure string operations work
        const decimalPlaces = Number(decimals);
        
        if (typeof amount === 'bigint') {
            // Convert BigInt to string and pad with zeros if needed
            strAmount = amount.toString();
            // Pad with leading zeros if necessary
            if (strAmount.length <= decimalPlaces) {
                strAmount = '0'.repeat(decimalPlaces - strAmount.length + 1) + strAmount;
            }
            // Insert decimal point from right
            const insertIndex = strAmount.length - decimalPlaces;
            strAmount = strAmount.slice(0, insertIndex) + '.' + strAmount.slice(insertIndex);
            // Remove trailing zeros and decimal point if no decimals
            strAmount = strAmount.replace(/\.?0+$/, '');
        } else {
            strAmount = amount;
        }

        // Parse the string amount
        const numAmount = parseFloat(strAmount);
        if (isNaN(numAmount)) return '0.00';
        
        // Split into integer and decimal parts
        const [integerPart, decimalPart = ''] = strAmount.split('.');
        
        // Add commas to the integer part
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        
        // Pad or truncate decimal part as needed
        const formattedDecimal = decimalPart.padEnd(2, '0').slice(0, decimalPlaces);
        
        // Return the formatted number
        return formattedDecimal ? `${formattedInteger}.${formattedDecimal}` : `${formattedInteger}.00`;
    } catch (error) {
        console.error('Error formatting amount:', error);
        return '0.00';
    }
}

const getTokenInfo = (symbol: string) => {
    if (!symbol) return null
    return tokenData.find(t => t.symbol.toLowerCase() === symbol.toLowerCase())
}

onMounted(async () => {
    await ensureTokenDetails()
})
</script>