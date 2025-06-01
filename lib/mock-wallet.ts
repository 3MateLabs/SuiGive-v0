"use client";

import { Transaction } from '@mysten/sui/transactions';
import { SUI_CONFIG } from './sui-config';

/**
 * Mock wallet implementation for testing
 * This allows us to bypass the wallet integration issues for development
 */

// Mock transaction result
const MOCK_TRANSACTION_RESULT = {
  digest: '0x' + Array(64).fill('0').join(''),
  effects: {
    status: { status: 'success' },
    events: [],
    gasUsed: {
      computationCost: '1000000',
      storageCost: '1000000',
      storageRebate: '0',
    }
  }
};

// Function to simulate transaction execution
export async function mockExecuteTransaction(tx: Transaction) {
  console.log('Executing mock transaction:', tx);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return MOCK_TRANSACTION_RESULT;
}

// Function to create a mock campaign
export async function mockCreateCampaign(
  name: string,
  description: string,
  imageUrl: string,
  goalAmount: number,
  deadline: number,
  category: string
) {
  console.log('Creating mock campaign with:', {
    name,
    description,
    imageUrl,
    goalAmount,
    deadline,
    category
  });
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Generate a random campaign ID
  const campaignId = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  
  return {
    ...MOCK_TRANSACTION_RESULT,
    campaignId
  };
}

// Function to donate to a campaign
export async function mockDonate(
  campaignId: string,
  amount: number,
  isAnonymous: boolean = false
) {
  console.log('Making mock donation:', {
    campaignId,
    amount,
    isAnonymous
  });
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return MOCK_TRANSACTION_RESULT;
}

// Function to withdraw funds from a campaign
export async function mockWithdrawFunds(
  campaignId: string,
  capabilityId: string
) {
  console.log('Making mock withdrawal:', {
    campaignId,
    capabilityId
  });
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return MOCK_TRANSACTION_RESULT;
}
