import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a SUI amount with proper decimals
 * @param amount The amount in MIST (smallest SUI unit)
 * @param decimals Number of decimals to display (default: 4)
 * @returns Formatted string with SUI amount
 */
export function formatSUI(amount: bigint | string | number, decimals: number = 4): string {
  // Convert to bigint if it's not already
  const amountBigInt = typeof amount === 'bigint' ? amount : BigInt(amount);
  
  // SUI has 9 decimals
  const suiDecimals = 9;
  const divisor = BigInt(10 ** suiDecimals);
  
  // Calculate whole and fractional parts
  const wholePart = amountBigInt / divisor;
  const fractionalPart = amountBigInt % divisor;
  
  // Format the fractional part with leading zeros
  let fractionalStr = fractionalPart.toString().padStart(suiDecimals, '0');
  
  // Trim to the specified number of decimals
  fractionalStr = fractionalStr.substring(0, decimals);
  
  // Return formatted string
  return `${wholePart}${fractionalStr ? '.' + fractionalStr : ''}`;
}
