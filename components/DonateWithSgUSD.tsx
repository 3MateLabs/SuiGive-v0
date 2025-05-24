"use client";

import React, { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { SUI_CONFIG } from '@/lib/sui-config';
import { useSuiCampaigns } from '@/hooks/useSuiCampaigns';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface DonateWithSgUSDProps {
  campaignId: string;
  campaignName: string;
  onDonationComplete?: () => void;
}

export default function DonateWithSgUSD({ campaignId, campaignName, onDonationComplete }: DonateWithSgUSDProps) {
  const currentAccount = useCurrentAccount();
  const client = useSuiClient();
  const { donate, donateSgUSD, loading } = useSuiCampaigns();
  
  const [suiAmount, setSuiAmount] = useState<string>('1');
  const [sgUSDAmount, setSgUSDAmount] = useState<string>('10');
  const [sgUSDCoins, setSgUSDCoins] = useState<{id: string, balance: string}[]>([]);
  const [selectedCoinId, setSelectedCoinId] = useState<string>('');
  const [sgUSDBalance, setSgUSDBalance] = useState<string>('0');
  
  // Fetch sgUSD coins when account changes
  useEffect(() => {
    const fetchSgUSDCoins = async () => {
      if (!currentAccount?.address) return;
      
      try {
        // Query for sgUSD coins owned by the user
        const coins = await client.getCoins({
          owner: currentAccount.address,
          coinType: `${SUI_CONFIG.PACKAGE_ID}::sg_usd::SG_USD`
        });
        
        // Format coins with balance
        const formattedCoins = coins.data.map(coin => ({
          id: coin.coinObjectId,
          balance: formatBalance(BigInt(coin.balance))
        }));
        
        setSgUSDCoins(formattedCoins);
        
        // Calculate total balance
        const totalBalance = coins.data.reduce((acc, coin) => acc + BigInt(coin.balance), BigInt(0));
        setSgUSDBalance(formatBalance(totalBalance));
        
        // Select the first coin by default if available
        if (formattedCoins.length > 0) {
          setSelectedCoinId(formattedCoins[0].id);
        }
      } catch (error) {
        console.error('Error fetching sgUSD coins:', error);
      }
    };
    
    fetchSgUSDCoins();
  }, [currentAccount, client]);
  
  // Format balance with proper decimals
  const formatBalance = (balance: bigint): string => {
    const balanceStr = balance.toString().padStart(10, '0');
    const integerPart = balanceStr.slice(0, -9) || '0';
    const decimalPart = balanceStr.slice(-9);
    return `${integerPart}.${decimalPart.substring(0, 2)}`;
  };
  
  // Handle SUI donation
  const handleSuiDonation = async () => {
    if (!currentAccount) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (!suiAmount || parseFloat(suiAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    try {
      toast.loading('Processing donation...', { id: 'donation' });
      
      // Convert SUI to MIST (1 SUI = 10^9 MIST)
      const amountMist = BigInt(Math.floor(parseFloat(suiAmount) * 1_000_000_000));
      
      await donate(campaignId, Number(amountMist), false);
      
      toast.success('Donation successful!', { id: 'donation' });
      
      // Call the callback if provided
      if (onDonationComplete) {
        onDonationComplete();
      }
    } catch (error: any) {
      console.error('Error donating:', error);
      toast.error(`Donation failed: ${error.message || 'Unknown error'}`, { id: 'donation' });
    }
  };
  
  // Handle sgUSD donation
  const handleSgUSDDonation = async () => {
    if (!currentAccount) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (!sgUSDAmount || parseFloat(sgUSDAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (!selectedCoinId) {
      toast.error('No sgUSD coin selected');
      return;
    }
    
    try {
      toast.loading('Processing sgUSD donation...', { id: 'donation' });
      
      // Convert sgUSD to smallest unit (1 sgUSD = 10^9 units)
      const amountUnits = BigInt(Math.floor(parseFloat(sgUSDAmount) * 1_000_000_000));
      
      await donateSgUSD(campaignId, selectedCoinId, Number(amountUnits), false);
      
      toast.success('sgUSD donation successful!', { id: 'donation' });
      
      // Call the callback if provided
      if (onDonationComplete) {
        onDonationComplete();
      }
    } catch (error: any) {
      console.error('Error donating with sgUSD:', error);
      toast.error(`sgUSD donation failed: ${error.message || 'Unknown error'}`, { id: 'donation' });
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Donate to {campaignName}</CardTitle>
        <CardDescription>Support this campaign with SUI or sgUSD tokens</CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="sui">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sui">Donate with SUI</TabsTrigger>
          <TabsTrigger value="sgusd">Donate with sgUSD</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sui">
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="suiAmount">Amount (SUI)</Label>
              <Input
                id="suiAmount"
                type="number"
                min="0.000000001"
                step="0.1"
                value={suiAmount}
                onChange={(e) => setSuiAmount(e.target.value)}
                placeholder="Enter amount in SUI"
              />
            </div>
          </CardContent>
          
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleSuiDonation}
              disabled={loading || !currentAccount}
            >
              {loading ? 'Processing...' : 'Donate SUI'}
            </Button>
          </CardFooter>
        </TabsContent>
        
        <TabsContent value="sgusd">
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="sgUSDAmount">Amount (sgUSD)</Label>
                <span className="text-sm text-gray-500">Balance: {sgUSDBalance} sgUSD</span>
              </div>
              <Input
                id="sgUSDAmount"
                type="number"
                min="0.000000001"
                step="1"
                value={sgUSDAmount}
                onChange={(e) => setSgUSDAmount(e.target.value)}
                placeholder="Enter amount in sgUSD"
              />
            </div>
            
            {sgUSDCoins.length > 0 ? (
              <div className="space-y-2">
                <Label>Select sgUSD Coin</Label>
                <select 
                  className="w-full p-2 border rounded"
                  value={selectedCoinId}
                  onChange={(e) => setSelectedCoinId(e.target.value)}
                >
                  {sgUSDCoins.map(coin => (
                    <option key={coin.id} value={coin.id}>
                      {coin.id.substring(0, 8)}... ({coin.balance} sgUSD)
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="text-amber-600 text-sm">
                You don't have any sgUSD tokens. Mint some from the Tokens page first.
              </div>
            )}
          </CardContent>
          
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleSgUSDDonation}
              disabled={loading || !currentAccount || sgUSDCoins.length === 0}
            >
              {loading ? 'Processing...' : 'Donate sgUSD'}
            </Button>
          </CardFooter>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
