"use client";

import React, { useState, useEffect } from 'react';
import { useCurrentAccount, useSignTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';
import { SUI_CONFIG } from '@/lib/sui-config';
import { toast } from 'react-hot-toast';

export default function SgUSDTokens() {
  const currentAccount = useCurrentAccount();
  const { mutate: signTransaction } = useSignTransaction();
  const client = useSuiClient();
  const [amount, setAmount] = useState<number>(100);
  const [loading, setLoading] = useState<boolean>(false);
  const [sgUSDBalance, setSgUSDBalance] = useState<string>('0');
  const [managerObject, setManagerObject] = useState<string | null>(null);

  // Fetch sgUSD Manager object and user's sgUSD balance
  useEffect(() => {
    const fetchSgUSDData = async () => {
      try {
        // Use the SGUSD_Manager_ID directly from the config
        setManagerObject(SUI_CONFIG.SGUSD_MANAGER_ID);
        
        // For debugging
        console.log('Using SGUSD Manager:', SUI_CONFIG.SGUSD_MANAGER_ID);

        // Only fetch balance if we have a connected wallet
        if (currentAccount?.address) {
          const coins = await client.getCoins({
            owner: currentAccount.address,
            coinType: `${SUI_CONFIG.PACKAGE_ID}::sg_usd::SG_USD`
          });

          // Calculate total balance
          const total = coins.data.reduce((acc, coin) => acc + BigInt(coin.balance), BigInt(0));
          setSgUSDBalance(formatBalance(total));
        }
      } catch (error) {
        console.error('Error fetching sgUSD data:', error);
      }
    };

    fetchSgUSDData();
  }, [client, currentAccount]);

  // Format balance with proper decimals
  const formatBalance = (balance: bigint): string => {
    const balanceStr = balance.toString().padStart(10, '0');
    const integerPart = balanceStr.slice(0, -9) || '0';
    const decimalPart = balanceStr.slice(-9);
    return `${integerPart}.${decimalPart.substring(0, 2)}`;
  };

  // Mint sgUSD tokens
  const mintSgUSD = async () => {
    if (!currentAccount || !managerObject) {
      toast.error('Wallet not connected or sgUSD Manager not found');
      return;
    }

    try {
      setLoading(true);

      // Create transaction
      const tx = new Transaction();
      
      // Set explicit gas budget to avoid automatic budget determination issues
      tx.setGasBudget(10000000);
      
      // For mint amount, we need to ensure it's a proper integer
      // The Move function expects a u64 value
      const mintAmountWithDecimals = Math.floor(amount * 1000000000);
      
      // Call the mint function
      tx.moveCall({
        target: `${SUI_CONFIG.PACKAGE_ID}::sg_usd::mint`,
        arguments: [
          tx.object(managerObject),
          // Use a different approach for the amount
          tx.pure.u64(mintAmountWithDecimals.toString()),
          // Pass the address directly
          tx.pure.address(currentAccount.address),
        ],
      });

      // Sign and execute the transaction
      const result = await signTransaction({
        transaction: tx,
      });

      console.log('Mint transaction signed:', result);
      toast.success(`Transaction signed! sgUSD tokens will be minted shortly.`);
      
      // Refresh balance after a short delay to allow transaction to process
      setTimeout(async () => {
        try {
          const coins = await client.getCoins({
            owner: currentAccount.address,
            coinType: `${SUI_CONFIG.PACKAGE_ID}::sg_usd::SG_USD`
          });
          
          const total = coins.data.reduce((acc, coin) => acc + BigInt(coin.balance), BigInt(0));
          setSgUSDBalance(formatBalance(total));
        } catch (err) {
          console.error('Error refreshing balance:', err);
        }
      }, 5000);
    } catch (error) {
      console.error('Error minting sgUSD:', error);
      toast.error('Failed to mint sgUSD tokens');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">sgUSD Tokens</h2>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-md">
        <p className="text-sm text-gray-600">Current Balance:</p>
        <p className="text-xl font-semibold">{sgUSDBalance} sgUSD</p>
      </div>
      
      <div className="mb-4">
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
          Amount to Mint
        </label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          min="1"
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      
      <button
        onClick={mintSgUSD}
        disabled={loading || !currentAccount || !managerObject}
        className={`w-full py-2 px-4 rounded-md text-white font-medium ${
          loading || !currentAccount || !managerObject
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {loading ? 'Minting...' : 'Mint sgUSD Tokens'}
      </button>
      
      {!currentAccount && (
        <p className="mt-2 text-sm text-red-600">
          Please connect your wallet to mint sgUSD tokens
        </p>
      )}
      
      {!managerObject && currentAccount && (
        <p className="mt-2 text-sm text-red-600">
          sgUSD Manager not found. Contract may not be deployed yet.
        </p>
      )}
      
      <div className="mt-6 text-sm text-gray-600">
        <p>sgUSD is a SuiGive stablecoin for donations on the platform.</p>
        <p className="mt-1">Use these tokens to support campaigns and receive special NFT receipts.</p>
      </div>
    </div>
  );
}
