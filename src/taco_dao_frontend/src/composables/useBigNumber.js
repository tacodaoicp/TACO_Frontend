import BigNumber from 'bignumber.js';

export function useBigNumber() {
  // Helper function to convert inputs to BigNumber
  const toBigNumber = (value) => {
    if (typeof value === 'bigint') {
      return new BigNumber(value.toString()); // Convert BigInt to string, then BigNumber
    }
    return new BigNumber(value); // Handle numbers or strings directly
  };

  // Define operations
  const add = (a, b) => toBigNumber(a).plus(toBigNumber(b));
  const subtract = (a, b) => toBigNumber(a).minus(toBigNumber(b));
  const multiply = (a, b) => toBigNumber(a).times(toBigNumber(b));
  const divide = (a, b) => toBigNumber(a).div(toBigNumber(b));

  return {
    add,
    subtract,
    multiply,
    divide,
  };
}