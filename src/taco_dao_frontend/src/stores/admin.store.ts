/**
 * Admin Store - Utilities and helpers for admin functionality
 * Contains reusable formatting functions and admin-specific state management
 */

import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useAdminStore = defineStore('admin', () => {
  
  // # CONSTANTS #
  
  const TACO_DECIMALS = 8
  const TACO_SATOSHIS_PER_TOKEN = 100_000_000

  // # STATE #
  
  // Could add admin-specific state here in the future
  // const adminSettings = ref({})

  // # FORMATTING FUNCTIONS #

  /**
   * Format TACO amount from satoshis with full precision
   * Shows all significant digits, removes trailing zeros
   * Never rounds - preserves exact blockchain amounts
   * 
   * @param satoshis - Amount in TACO satoshis
   * @returns Formatted TACO amount (e.g., "999.99999999", "12.34", "1000")
   */
  const formatTacoPrecise = (satoshis: bigint | number | string): string => {
    try {
      // Convert to BigInt for consistent handling
      const satoshisBI = typeof satoshis === 'bigint' ? satoshis : BigInt(satoshis || 0)
      
      // Convert from satoshis to TACO tokens
      const tacoTokens = Number(satoshisBI) / TACO_SATOSHIS_PER_TOKEN
      
      // Format with full 8 decimals then remove trailing zeros
      const formatted = tacoTokens.toFixed(TACO_DECIMALS)
      return formatted.replace(/\.?0+$/, '') || '0'
    } catch (error) {
      console.error('Error formatting TACO amount precisely:', error, satoshis)
      return '0'
    }
  }

  /**
   * Format TACO tokens (already converted from satoshis) with full precision
   * Shows all significant digits, removes trailing zeros
   * 
   * @param tacoTokens - Amount in TACO tokens
   * @returns Formatted TACO amount (e.g., "999.99999999", "12.34", "1000")
   */
  const formatTacoFromTokens = (tacoTokens: number | string): string => {
    try {
      const tokenNum = Number(tacoTokens || 0)
      
      // Format with full 8 decimals then remove trailing zeros
      const formatted = tokenNum.toFixed(TACO_DECIMALS)
      return formatted.replace(/\.?0+$/, '') || '0'
    } catch (error) {
      console.error('Error formatting TACO tokens:', error, tacoTokens)
      return '0'
    }
  }

  /**
   * Format TACO amount from satoshis with fixed decimals (for display consistency)
   * Always shows the specified number of decimal places
   * 
   * @param satoshis - Amount in TACO satoshis
   * @param decimals - Number of decimal places to show (default: 8)
   * @returns Formatted TACO amount with fixed decimals
   */
  const formatTacoFixed = (satoshis: bigint | number | string, decimals: number = TACO_DECIMALS): string => {
    try {
      const satoshisBI = typeof satoshis === 'bigint' ? satoshis : BigInt(satoshis || 0)
      const tacoTokens = Number(satoshisBI) / TACO_SATOSHIS_PER_TOKEN
      return tacoTokens.toFixed(decimals)
    } catch (error) {
      console.error('Error formatting TACO amount with fixed decimals:', error, satoshis)
      return '0.' + '0'.repeat(decimals)
    }
  }

  /**
   * Format TACO amount from satoshis for short display (6 decimals max)
   * Removes trailing zeros but caps at 6 decimal places for UI space
   * 
   * @param satoshis - Amount in TACO satoshis
   * @returns Formatted TACO amount (shorter version)
   */
  const formatTacoShort = (satoshis: bigint | number | string): string => {
    try {
      const satoshisBI = typeof satoshis === 'bigint' ? satoshis : BigInt(satoshis || 0)
      const tacoTokens = Number(satoshisBI) / TACO_SATOSHIS_PER_TOKEN
      
      // Format with 6 decimals then remove trailing zeros
      const formatted = tacoTokens.toFixed(6)
      return formatted.replace(/\.?0+$/, '') || '0'
    } catch (error) {
      console.error('Error formatting TACO amount short:', error, satoshis)
      return '0'
    }
  }

  /**
   * Convert TACO tokens to satoshis
   * 
   * @param tokens - Amount in TACO tokens
   * @returns Amount in TACO satoshis
   */
  const tacoTokensToSatoshis = (tokens: number): bigint => {
    return BigInt(Math.floor(tokens * TACO_SATOSHIS_PER_TOKEN))
  }

  /**
   * Convert TACO satoshis to tokens
   * 
   * @param satoshis - Amount in TACO satoshis
   * @returns Amount in TACO tokens
   */
  const tacoSatoshisToTokens = (satoshis: bigint | number | string): number => {
    const satoshisBI = typeof satoshis === 'bigint' ? satoshis : BigInt(satoshis || 0)
    return Number(satoshisBI) / TACO_SATOSHIS_PER_TOKEN
  }

  // # HELPER FUNCTIONS #

  /**
   * Format a principal ID for display (truncated)
   * 
   * @param principal - Principal ID string
   * @returns Truncated principal for display
   */
  const formatPrincipal = (principal: string): string => {
    if (!principal) return 'Unknown'
    
    // Remove dashes and truncate
    const cleaned = principal.replace(/-/g, '')
    if (cleaned.length <= 8) return cleaned
    
    return cleaned.substring(0, 4) + '…' + cleaned.substring(cleaned.length - 4)
  }

  /**
   * Calculate percentage with proper precision
   * 
   * @param part - The part value
   * @param total - The total value
   * @param decimals - Number of decimal places (default: 2)
   * @returns Formatted percentage
   */
  const calculatePercentage = (part: number | bigint, total: number | bigint, decimals: number = 2): string => {
    try {
      const partNum = typeof part === 'bigint' ? Number(part) : Number(part || 0)
      const totalNum = typeof total === 'bigint' ? Number(total) : Number(total || 0)
      
      if (totalNum === 0) return '0'
      
      const percentage = (partNum / totalNum) * 100
      return percentage.toFixed(decimals)
    } catch (error) {
      console.error('Error calculating percentage:', error, part, total)
      return '0'
    }
  }

  // # RETURN #
  
  return {
    // Constants
    TACO_DECIMALS,
    TACO_SATOSHIS_PER_TOKEN,
    
    // Formatting functions
    formatTacoPrecise,
    formatTacoFromTokens,
    formatTacoFixed,
    formatTacoShort,
    
    // Conversion functions
    tacoTokensToSatoshis,
    tacoSatoshisToTokens,
    
    // Helper functions
    formatPrincipal,
    calculatePercentage,
  }
})
