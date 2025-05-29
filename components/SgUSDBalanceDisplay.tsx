"use client";

import React, { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { SUI_CONFIG } from '@/lib/sui-config';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function SgUSDBalanceDisplay() {
  const currentAccount = useCurrentAccount();
  const client = useSuiClient();
  const [sgUSDBalance, setSgUSDBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch sgUSD balance when account changes
  useEffect(() => {
    const fetchSgUSDBalance = async () => {
      if (!currentAccount?.address) {
        setSgUSDBalance('0');
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        // Query for sgUSD coins owned by the user
        const coins = await client.getCoins({
          owner: currentAccount.address,
          coinType: `${SUI_CONFIG.PACKAGE_ID}::sg_usd::SG_USD`
        });
        
        // Calculate total balance
        const totalBalance = coins.data.reduce((acc, coin) => acc + BigInt(coin.balance), BigInt(0));
        setSgUSDBalance(formatBalance(totalBalance));
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching sgUSD balance:', error);
        setSgUSDBalance('0');
        setIsLoading(false);
      }
    };
    
    fetchSgUSDBalance();
    
    // Set up a refresh interval (every 30 seconds)
    const intervalId = setInterval(fetchSgUSDBalance, 30000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [currentAccount, client]);
  
  // Format balance with proper decimals
  const formatBalance = (balance: bigint): string => {
    const balanceStr = balance.toString().padStart(10, '0');
    const integerPart = balanceStr.slice(0, -9) || '0';
    const decimalPart = balanceStr.slice(-9);
    return `${integerPart}.${decimalPart.substring(0, 2)}`;
  };
  
  if (!currentAccount) {
    return null;
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 text-sui-navy hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer animate-pulse-slow">
            {isLoading ? (
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full border-2 border-blue-300 border-t-transparent animate-spin"></div>
                <span className="text-sm font-medium">Loading</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-sui-navy animate-bounce-subtle">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M15 8.5C14.315 7.81501 13.1087 7.33855 12 7.30872M9 15C9.64448 15.8593 10.8428 16.3494 12 16.391M12 7.30872C10.6809 7.27322 9.5 7.86998 9.5 9.50001C9.5 12.5 15 11 15 14C15 15.711 13.5362 16.3854 12 16.391M12 7.30872V5.5M12 16.391V18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-sm font-semibold">{sgUSDBalance} <span className="text-blue-600">sgUSD</span></span>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-sui-navy text-white border-sui-navy">
          <p className="text-xs">Your sgUSD Balance</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
