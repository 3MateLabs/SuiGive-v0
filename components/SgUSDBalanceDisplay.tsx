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
          <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer">
            {isLoading ? (
              <span className="flex items-center">
                <span className="w-3 h-3 mr-1 rounded-full animate-pulse bg-green-300"></span>
                Loading...
              </span>
            ) : (
              <span className="flex items-center">
                <span className="w-3 h-3 mr-1 rounded-full bg-green-500"></span>
                {sgUSDBalance} sgUSD
              </span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Your sgUSD Balance</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
