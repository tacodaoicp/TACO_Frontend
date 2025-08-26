# Swap Stores Documentation

This document describes the Kong and ICPSwap stores that provide frontend swap functionality.

## Kong Store (`kong.store.ts`)

The Kong store provides methods for executing swaps on the Kong decentralized exchange.

### Methods

#### `getQuote(params: QuoteParams)`
Gets a quote for a potential swap:
- Calls Kong's `swap_amounts` method to get pricing information
- Returns detailed quote including amount out, price, slippage, and fees
- Does not require tokens or execute any transactions

#### `icrc2_swap(params: SwapParams)`
Executes a swap using ICRC2 approval mechanism:
1. Creates an ICRC2 approval for Kong canister to spend tokens
2. Calls Kong swap without a transaction ID (Kong will use ICRC2 to transfer)

#### `icrc1_swap(params: SwapParams)`
Executes a swap using ICRC1 transfer mechanism:
1. Transfers tokens directly to Kong canister
2. Calls Kong swap with the transfer transaction ID

### Interfaces

#### `QuoteParams`
```typescript
interface QuoteParams {
  sellTokenSymbol: string       // Symbol of token to sell (e.g., "TACO")
  buyTokenSymbol: string        // Symbol of token to buy (e.g., "ICP") 
  amountIn: bigint             // Amount to swap (in token's base units)
}
```

#### `SwapParams`
```typescript
interface SwapParams {
  sellTokenPrincipal: string    // Principal ID of token to sell
  sellTokenSymbol: string       // Symbol of token to sell (e.g., "TACO")
  buyTokenPrincipal: string     // Principal ID of token to buy
  buyTokenSymbol: string        // Symbol of token to buy (e.g., "ICP")
  amountIn: bigint             // Amount to swap (in token's base units)
  minAmountOut: bigint         // Minimum expected output amount
  slippageTolerance: number    // Maximum slippage (e.g., 0.01 for 1%)
  recipient?: Principal        // Optional recipient (defaults to caller)
}
```

#### `KongQuoteResult`
```typescript
interface KongQuoteResult {
  pay_chain: string            // Chain of input token
  pay_symbol: string           // Symbol of input token
  pay_address: string          // Address of input token
  pay_amount: bigint           // Input amount
  receive_chain: string        // Chain of output token
  receive_symbol: string       // Symbol of output token  
  receive_address: string      // Address of output token
  receive_amount: bigint       // Expected output amount
  price: number                // Execution price
  mid_price: number            // Spot/mid price
  slippage: number             // Calculated slippage percentage
  txs: any[]                   // Transaction details
}
```

### Example Usage
```typescript
import { useKongStore } from './stores/kong.store'

const kongStore = useKongStore()

// Get a quote first
try {
  const quote = await kongStore.getQuote({
    sellTokenSymbol: 'TACO',
    buyTokenSymbol: 'ICP',
    amountIn: BigInt(1000000), // 0.01 TACO (8 decimals)
  })
  console.log('Quote:', quote)
  console.log('Expected to receive:', quote.receive_amount, 'ICP')
  console.log('Slippage:', quote.slippage, '%')
} catch (error) {
  console.error('Quote failed:', error)
}

// ICRC2 swap example
try {
  const result = await kongStore.icrc2_swap({
    sellTokenPrincipal: 'rrkah-fqaaa-aaaaa-aaaaq-cai', // TACO
    sellTokenSymbol: 'TACO',
    buyTokenPrincipal: 'ryjl3-tyaaa-aaaaa-aaaba-cai',  // ICP
    buyTokenSymbol: 'ICP',
    amountIn: BigInt(1000000), // 0.01 TACO (8 decimals)
    minAmountOut: BigInt(100000), // Minimum ICP expected
    slippageTolerance: 0.01, // 1% slippage
  })
  console.log('Swap successful:', result)
} catch (error) {
  console.error('Swap failed:', error)
}
```

## ICPSwap Store (`icpswap.store.ts`)

The ICPSwap store provides methods for executing swaps on ICPSwap pools, plus utility functions for fund recovery.

### Methods

#### `getQuote(params: QuoteParams)`
Gets a quote for a potential swap:
- Looks up the correct pool canister for the token pair
- Gets pool metadata for pricing information
- Calls the pool's `quote` method to get expected output amount
- Calculates slippage, effective price, and spot price
- Returns detailed quote information

#### `icrc2_swap(params: SwapParams)`
Executes a swap using ICRC2 approval mechanism:
1. Looks up the correct pool canister for the token pair
2. Creates an ICRC2 approval for the pool canister
3. Calls `depositFrom` to deposit tokens from user account
4. Executes the swap
5. Withdraws the received tokens to user's wallet

#### `icrc1_swap(params: SwapParams)`
Executes a swap using ICRC1 transfer mechanism:
1. Looks up the correct pool canister for the token pair
2. Transfers tokens to the pool's subaccount for the user
3. Calls `deposit` to register the deposited tokens
4. Executes the swap
5. Withdraws the received tokens to user's wallet

#### `sweep(params: SweepParams)`
Recovery function to retrieve any stranded funds:
1. Checks if user has any balance in their subaccount on the pool and deposits it
2. Checks if user has any unused balance on the pool and withdraws it

### Additional Interfaces

#### `ICPSwapQuoteResult`
```typescript
interface ICPSwapQuoteResult {
  amountOut: bigint           // Expected output amount
  slippage: number            // Calculated slippage percentage
  fee: number                 // Pool fee
  token0: Token               // First token in pair
  token1: Token               // Second token in pair
  effectivePrice: number      // Price from this specific quote
  spotPrice: number           // Current spot price from pool
}
```

#### `SweepParams`
```typescript
interface SweepParams {
  token0Principal: string   // First token in the pair
  token1Principal: string   // Second token in the pair
  poolId?: string          // Optional pool canister ID (will lookup if not provided)
}
```

### Example Usage
```typescript
import { useICPSwapStore } from './stores/icpswap.store'

const icpswapStore = useICPSwapStore()

// Get a quote first
try {
  const quote = await icpswapStore.getQuote({
    sellTokenPrincipal: 'rrkah-fqaaa-aaaaa-aaaaq-cai', // TACO
    buyTokenPrincipal: 'ryjl3-tyaaa-aaaaa-aaaba-cai',  // ICP
    amountIn: BigInt(1000000), // 0.01 TACO (8 decimals)
  })
  console.log('Quote:', quote)
  console.log('Expected to receive:', quote.amountOut, 'ICP units')
  console.log('Slippage:', quote.slippage, '%')
  console.log('Effective price:', quote.effectivePrice)
} catch (error) {
  console.error('Quote failed:', error)
}

// ICRC2 swap example
try {
  const result = await icpswapStore.icrc2_swap({
    sellTokenPrincipal: 'rrkah-fqaaa-aaaaa-aaaaq-cai', // TACO
    buyTokenPrincipal: 'ryjl3-tyaaa-aaaaa-aaaba-cai',  // ICP
    amountIn: BigInt(1000000), // 0.01 TACO (8 decimals)
    minAmountOut: BigInt(100000), // Minimum ICP expected
    slippageTolerance: 0.01, // 1% slippage
  })
  console.log('Swap successful:', result)
} catch (error) {
  console.error('Swap failed:', error)
  
  // Try to sweep any stranded funds
  await icpswapStore.sweep({
    token0Principal: 'rrkah-fqaaa-aaaaa-aaaaq-cai',
    token1Principal: 'ryjl3-tyaaa-aaaaa-aaaba-cai',
  })
}
```

## Error Handling

Both stores include comprehensive error handling:

- **Authentication errors**: Thrown when user is not logged in
- **Approval errors**: When ICRC2 approvals fail
- **Transfer errors**: When ICRC1 transfers fail
- **Swap errors**: When the actual swap execution fails
- **Network errors**: When canister calls fail

The ICPSwap store automatically attempts to sweep stranded funds when swaps fail to ensure user funds are not lost in the pool.

## State Management

Both stores provide reactive state:

- `isLoading`: Boolean indicating if a swap is in progress
- `lastError`: String containing the last error message (or null)

## Architecture Notes

### Kong Integration
- Kong expects token symbols prefixed with "IC." (e.g., "IC.TACO")
- Kong can use either ICRC1 transfers (with transaction ID) or ICRC2 approvals
- Kong handles the complexity of routing and execution internally

### ICPSwap Integration
- Each token pair has its own pool canister
- Pool canisters are looked up via the factory canister
- ICPSwap uses a deposit/swap/withdraw pattern
- User funds are managed in subaccounts derived from their principal
- The sweep function is critical for fund recovery if operations fail

### Security Considerations
- All operations require user authentication via Internet Identity
- Approvals are scoped to specific amounts and canisters
- Error handling includes automatic fund recovery attempts
- No private keys or sensitive data are stored in the frontend
