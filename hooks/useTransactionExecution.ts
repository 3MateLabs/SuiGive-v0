"use client";

import { useSignAndExecuteTransaction, useCurrentAccount, useCurrentWallet } from '@mysten/dapp-kit';
import { useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { SUI_CONFIG } from '../lib/sui-config';
import { type SuiTransactionBlockResponse } from '@mysten/sui/client';

// Define the type for the transaction output
type TransactionOutput = any; // Using any for now as a workaround

/**
 * Custom hook for transaction execution using dapp-kit
 * This hook provides a wrapper around the useSignAndExecuteTransaction hook
 * from dapp-kit to make it easier to use in our application
 */
export interface TransactionExecutionHook {
  executeTransaction: (transaction: Transaction) => Promise<any>;
  createCampaign: (name: string, description: string, imageUrl: string, goalAmount: number, deadline: number, category: string) => Promise<any>;
  donate: (campaignId: string, amount: number, isAnonymous?: boolean) => Promise<any>;
  donateSgUSD: (campaignId: string, coinObjectId: string, amount: number, isAnonymous?: boolean) => Promise<any>;
  withdrawFunds: (campaignId: string, capabilityId: string) => Promise<any>;
  isPending: boolean;
  error: Error | null;
  isWalletConnected: boolean;
}

export function useTransactionExecution(): TransactionExecutionHook {
  // Get the SUI client
  const client = useSuiClient();
  
  // Get the current wallet and account
  const currentWallet = useCurrentWallet();
  const currentAccount = useCurrentAccount();
  
  // Use the dapp-kit hook for signing and executing transactions
  const { mutate: signAndExecute, isPending, error } = useSignAndExecuteTransaction();
  
  // Function to execute a transaction with proper error handling
  const executeTransaction = async (transaction: Transaction): Promise<TransactionOutput> => {
    if (!client) throw new Error('SuiClient not available');
    
    try {
      // We'll use the default execution flow provided by dapp-kit
      // which is more reliable than our custom implementation
      return await new Promise((resolve, reject) => {
        signAndExecute(
          { transaction },
          {
            onSuccess: (result) => resolve(result),
            onError: (error) => reject(error)
          }
        );
      });
    } catch (error) {
      console.error('Transaction execution error:', error);
      throw error;
    }
  };

  // Function to check if wallet is connected
  const checkWalletConnection = () => {
    if (!currentWallet || !currentWallet.isConnected) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }
    
    if (!currentAccount) {
      throw new Error('No account selected. Please select an account in your wallet.');
    }
    
    if (!client) {
      throw new Error('SuiClient not available. Please try again later.');
    }
  };
  
  // Function to create a campaign
  const createCampaign = async (
    name: string,
    description: string,
    imageUrl: string,
    goalAmount: number,
    deadline: number,
    category: string
  ): Promise<TransactionOutput> => {
    console.log('Creating campaign with transaction hook...');
    
    // Check wallet connection
    checkWalletConnection();
    
    // Create a new transaction
    const tx = new Transaction();
    
    // Get the registry object
    const registry = tx.object(SUI_CONFIG.REGISTRY_ID);
    
    // Set explicit gas budget to avoid automatic budget determination issues
    tx.setGasBudget(10000000);
    
    // Add the move call to create a campaign
    tx.moveCall({
      target: `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::create_campaign`,
      arguments: [
        registry,
        tx.pure.string(name),
        tx.pure.string(description),
        tx.pure.string(imageUrl),
        tx.pure.u64(goalAmount),
        tx.pure.u64(deadline),
        tx.pure.string(category),
      ],
    });
    
    try {
      // Execute the transaction using our helper function
      const result = await executeTransaction(tx);
      console.log('Campaign created successfully:', result);
      return result as TransactionOutput;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  };

  // Function to donate to a campaign
  const donate = async (
    campaignId: string,
    amount: number,
    isAnonymous: boolean = false
  ): Promise<TransactionOutput> => {
    console.log('Donating with transaction hook...');
    
    // Check wallet connection
    checkWalletConnection();
    
    // Create a new transaction
    const tx = new Transaction();
    
    // Get the campaign object
    const campaign = tx.object(campaignId);
    
    // Create a coin to donate
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)]);
    
    // Add the move call to donate
    tx.moveCall({
      target: `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::donate`,
      arguments: [
        campaign,
        coin,
        tx.pure.string(""),  // Empty message
        tx.pure.bool(isAnonymous),
      ],
    });
    
    try {
      // Execute the transaction using our helper function
      const result = await executeTransaction(tx);
      console.log('Donation executed successfully:', result);
      return result as TransactionOutput;
    } catch (error) {
      console.error('Error donating to campaign:', error);
      throw error;
    }
  };

  // Function to withdraw funds from a campaign
  const withdrawFunds = async (
    campaignId: string,
    capabilityId: string
  ): Promise<TransactionOutput> => {
    console.log('Withdrawing funds with transaction hook...');
    
    // Check wallet connection
    checkWalletConnection();
    
    // Create a new transaction
    const tx = new Transaction();
    
    // Get the campaign and capability objects
    const campaign = tx.object(campaignId);
    const capability = tx.object(capabilityId);
    
    // Add the move call to withdraw funds
    tx.moveCall({
      target: `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::withdraw_funds`,
      arguments: [
        campaign,
        capability,
      ],
    });
    
    try {
      // Execute the transaction using our helper function
      const result = await executeTransaction(tx);
      console.log('Withdrawal executed successfully:', result);
      return result as TransactionOutput;
    } catch (error) {
      console.error('Error withdrawing funds:', error);
      throw error;
    }
  };
  
  // Function to donate to a campaign with sgUSD tokens
  const donateSgUSD = async (
    campaignId: string,
    coinObjectId: string,
    amount: number,
    isAnonymous: boolean = false
  ): Promise<TransactionOutput> => {
    console.log('Donating with sgUSD using transaction hook...');
    
    // Check wallet connection
    checkWalletConnection();
    
    // Create a new transaction
    const tx = new Transaction();
    
    // Set explicit gas budget to avoid automatic budget determination issues
    tx.setGasBudget(10000000);
    
    // Get the campaign object
    const campaign = tx.object(campaignId);
    
    // Get the sgUSD coin object
    const sgUSDCoin = tx.object(coinObjectId);
    
    // First split the coin to get only the amount we want to donate
    // This is critical - otherwise the entire coin will be donated
    const splitCoin = tx.splitCoins(sgUSDCoin, [tx.pure.u64(amount.toString())]);
    
    // Add the move call to donate with sgUSD using only the split portion
    tx.moveCall({
      target: `${SUI_CONFIG.PACKAGE_ID}::crowdfunding::donate_sgusd`,
      arguments: [
        campaign,
        splitCoin,  // Use the split coin with the exact amount
        tx.pure.string(""),  // Empty message
        tx.pure.bool(isAnonymous),
      ],
    });
    
    try {
      // Execute the transaction using our helper function
      const result = await executeTransaction(tx);
      console.log('sgUSD Donation executed successfully:', result);
      return result as TransactionOutput;
    } catch (error) {
      console.error('Error donating with sgUSD to campaign:', error);
      throw error;
    }
  };

  // Return the hook functions and state
  return {
    executeTransaction,
    createCampaign,
    donate,
    donateSgUSD,
    withdrawFunds,
    isPending: isPending,
    error,
    isWalletConnected: currentWallet?.isConnected && !!currentAccount
  };
}

// Type is now defined at the top of the file
