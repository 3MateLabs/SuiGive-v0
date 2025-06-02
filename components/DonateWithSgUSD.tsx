"use client";

import React, { useState, useEffect, ChangeEvent, useCallback } from "react";
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { SUI_CONFIG } from '@/lib/sui-config';
import { useSuiCampaigns } from '@/hooks/useSuiCampaigns';
import { useCachedCoins } from '@/hooks/useCachedSuiData';
import { useGlobalSgUSDBalance, useStore } from '@/lib/store';
import { useCampaignProgress } from '@/hooks/useCampaignProgress';
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import NFTReceiptModal from './NFTReceiptModal';

interface DonateWithSgUSDProps {
  campaignId: string;
  campaignName: string;
  onDonationComplete?: (amount: number, amountInUnits: string) => void;
}

export default function DonateWithSgUSD({
  campaignId,
  campaignName,
  onDonationComplete,
}: DonateWithSgUSDProps) {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { donateSgUSD, loading } = useSuiCampaigns();
  const { currentAmount, goalAmount, progress } = useCampaignProgress(campaignId);

  // State for alert dialog when campaign is fully funded
  const [showFundedAlert, setShowFundedAlert] = useState(false);

  // Check if campaign is fully funded
  const isCampaignFullyFunded = progress >= 100;

  const [sgUSDAmount, setSgUSDAmount] = useState<string>("10");
  const [donationMessage, setDonationMessage] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [selectedCoinId, setSelectedCoinId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Use global state for SgUSD balance data
  const {
    balance: sgUSDBalance,
    balanceValue: sgUSDBalanceValue,
    coins: formattedCoins,
    setBalance: setSgUSDBalance,
    setBalanceValue: setSgUSDBalanceValue,
    setCoins: setFormattedCoins,
    shouldRefetch: shouldRefreshSgUSDBalance,
    invalidateCache: invalidateSgUSDBalance,
  } = useGlobalSgUSDBalance();

  // Get the setForceRefresh function directly from the store
  const setForceRefresh = useStore((state: any) => state.setForceRefresh);

  // Use our cached coins hook instead of direct RPC calls
  const {
    coins: sgUSDCoinsData,
    isLoading: coinsLoading,
    refresh: refreshCoins,
  } = useCachedCoins(
    currentAccount?.address,
    `${SUI_CONFIG.PACKAGE_ID}::sg_usd::SG_USD`
  );

  // Debounce the refresh to prevent excessive API calls
  const debouncedRefresh = useCallback(() => {
    // Use a timeout to prevent multiple refreshes in quick succession
    const timeoutId = setTimeout(() => {
      refreshCoins();
    }, 2000); // 2 second delay

    return () => clearTimeout(timeoutId);
  }, [refreshCoins]);

  // Process coins data when it changes - with debouncing
  useEffect(() => {
    // Check if we should refresh the data based on our global state policy
    if (shouldRefreshSgUSDBalance() || formattedCoins.length === 0) {
      // Only process data if we have it and it's not already in our global state
      if (sgUSDCoinsData && sgUSDCoinsData.length > 0) {
        try {
          // Calculate total balance
          const totalBalance = sgUSDCoinsData.reduce(
            (acc: bigint, coin: any) => acc + BigInt(coin.balance),
            BigInt(0)
          );
          setSgUSDBalanceValue(totalBalance);

          // Format for display
          const formattedBalance = (
            Number(totalBalance) / 1_000_000_000
          ).toFixed(2);
          setSgUSDBalance(formattedBalance);

          // Format coins for selection
          const formattedCoinsList = sgUSDCoinsData.map((coin: any) => ({
            id: coin.coinObjectId,
            balance: (Number(coin.balance) / 1_000_000_000).toFixed(2),
            balanceValue: BigInt(coin.balance),
          }));

          // Update global state with formatted coins
          setFormattedCoins(formattedCoinsList);

          // Select the first coin by default if available
          if (formattedCoinsList.length > 0 && !selectedCoinId) {
            setSelectedCoinId(formattedCoinsList[0].id);
          }

          console.log("Updated global SgUSD state with fresh data");
        } catch (error) {
          console.error("Error processing sgUSD coins:", error);
          toast.error("Failed to process your sgUSD balance");
        }
      }
    } else {
      console.log("Using cached SgUSD data from global store");
      // If we have coins in the global state but no selected coin, select one
      if (formattedCoins.length > 0 && !selectedCoinId) {
        setSelectedCoinId(formattedCoins[0].id);
      }
    }
  }, [
    sgUSDCoinsData,
    selectedCoinId,
    shouldRefreshSgUSDBalance,
    formattedCoins.length,
  ]);

  // Format balance with proper decimals
  const formatBalance = (balance: bigint): string => {
    const balanceStr = balance.toString().padStart(10, "0");
    const integerPart = balanceStr.slice(0, -9) || "0";
    const decimalPart = balanceStr.slice(-9);
    return `${integerPart}.${decimalPart.substring(0, 2)}`;
  };

  // Pre-donation check and alert for fully funded campaigns
  const handlePreDonate = () => {
    if (!currentAccount) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (isCampaignFullyFunded) {
      setShowFundedAlert(true);
    } else {
      processDonation();
    }
  };

  // Handle the actual donation transaction
  const processDonation = async () => {
    if (!currentAccount) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!selectedCoinId) {
      toast.error("No sgUSD coin selected");
      return;
    }

    const amountValue = parseFloat(sgUSDAmount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // Convert to smallest units (9 decimals)
    const amountInUnits = Math.floor(amountValue * 1_000_000_000);
    console.log("Donation amount in units:", amountInUnits);

    // Check if selected coin has enough balance
    const selectedCoin = sgUSDCoinsData.find(
      (coin: any) => coin.coinObjectId === selectedCoinId
    );
    if (!selectedCoin) {
      toast.error("Selected coin not found");
      return;
    }

    if (BigInt(selectedCoin.balance) < BigInt(amountInUnits)) {
      const formattedBalance = (
        Number(selectedCoin.balance) / 1_000_000_000
      ).toFixed(2);
      toast.error(
        `Not enough balance in selected coin. Available: ${formattedBalance} sgUSD`
      );
      return;
    }

    try {
      setIsLoading(true);
      toast.loading("Processing sgUSD donation...", { id: "donation" });

      console.log("Donation parameters:", {
        campaignId,
        selectedCoinId,
        amountInUnits,
        donationMessage,
        isAnonymous
      });

      // Execute the donation transaction
      const result = await donateSgUSD(
        campaignId,
        selectedCoinId,
        amountInUnits, // Pass as number, not string
        donationMessage,
        isAnonymous
      );

      toast.success("sgUSD donation successful!", { id: "donation" });

      // Don't update DOM directly - instead rely on the callback to update state
      // This ensures the UI is consistent with the state and persists across refreshes
      console.log("Donation successful, amount:", parseFloat(sgUSDAmount));

      // Calculate donation amount in blockchain units for the callback
      const donationAmountInUnits = amountInUnits.toString();

      // Use setTimeout to prevent React update loops when calling the callback
      // This breaks the synchronous update cycle that can cause infinite loops
      if (onDonationComplete) {
        // Small delay to ensure we don't trigger React update loops
        setTimeout(() => {
          onDonationComplete(parseFloat(sgUSDAmount), donationAmountInUnits);
        }, 50);
      }

      // Extract the object ID of the NFT receipt from the transaction result
      let nftObjectId = '';
      try {
        // Look for created objects in the transaction effects
        const createdObjects = result.effects?.created || [];
        // Find the NFT receipt object (it will have the donation_receipt::DonationReceipt type)
        const nftObject = createdObjects.find((obj: any) => 
          obj.owner === 'Owned' && 
          obj.reference?.objectId && 
          obj.type?.includes(`${SUI_CONFIG.PACKAGE_ID}::donation_receipt::DonationReceipt`)
        );
        
        if (nftObject?.reference?.objectId) {
          nftObjectId = nftObject.reference.objectId;
          console.log('Found NFT receipt object ID:', nftObjectId);
        } else {
          console.warn('No NFT receipt object found in transaction effects:', result.effects);
        }
      } catch (error) {
        console.error('Error extracting NFT object ID:', error);
      }
      
      // Set NFT data and show the modal
      const nftData = {
        amount: sgUSDAmount,
        campaignName,
        timestamp: Date.now(),
        ipfsHash: 'bafkreiap7rugqtnfnw5nlui4aavtrj6zrqbxzzanq44sxnztktm3kzdufi',
        objectId: nftObjectId,
        message: donationMessage,
        isAnonymous
      };
      console.log('Showing NFT modal with data:', nftData);
      
      // Force a small delay to ensure React state updates properly
      setTimeout(() => {
        setNFTData(nftData);
        setShowNFTModal(true);
        console.log('NFT modal state set to:', { showModal: true, data: nftData });
      }, 100);
    } catch (error: any) {
      console.error("Error donating with sgUSD:", error);
      toast.error(
        `sgUSD donation failed: ${error.message || "Unknown error"}`,
        { id: "donation" }
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Mint sgUSD tokens
  const mintSgUSD = async () => {
    if (!currentAccount) {
      toast.error("Wallet not connected");
      return;
    }

    try {
      setIsLoading(true);
      toast.loading("Preparing transaction...", { id: "mint-sgusd" });

      // Create transaction
      const tx = new Transaction();

      // Set explicit gas budget to avoid automatic budget determination issues
      tx.setGasBudget(10000000);

      // For mint amount, we need to ensure it's a proper integer
      // The Move function expects a u64 value - mint 1000 sgUSD (testnet)
      const mintAmountWithDecimals = 1000 * 1000000000;

      // Call the mint function
      tx.moveCall({
        target: `${SUI_CONFIG.PACKAGE_ID}::sg_usd::mint`,
        arguments: [
          tx.object(SUI_CONFIG.SGUSD_MANAGER_ID),
          tx.pure.u64(mintAmountWithDecimals.toString()),
          tx.pure.address(currentAccount.address),
        ],
      });

      // Sign and execute the transaction
      toast.loading("Processing transaction...", { id: "mint-sgusd" });

      await new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => {
              console.log("Transaction executed successfully:", result);
              toast.success("sgUSD tokens minted successfully!", {
                id: "mint-sgusd",
              });
              resolve(result);
            },
            onError: (error) => {
              console.error("Transaction failed:", error);
              toast.error(
                `Failed to mint tokens: ${error.message || "Unknown error"}`,
                { id: "mint-sgusd" }
              );
              reject(error);
            },
          }
        );
      });

      // Refresh balance after a short delay to allow transaction to process
      setTimeout(() => {
        // Use our debounced refresh function instead of direct API calls
        debouncedRefresh();
        // Force refresh by setting the global flag to true
        setForceRefresh(true);
      }, 5000); // Increased to 5 seconds to give blockchain more time to process
    } catch (error) {
      console.error("Error minting sgUSD:", error);
      toast.error("Failed to mint sgUSD tokens");
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user has enough sgUSD balance for the donation
  const hasEnoughBalance = () => {
    if (!sgUSDAmount || parseFloat(sgUSDAmount) <= 0) return false;

    // Convert input amount to the smallest unit
    const amountUnits = BigInt(
      Math.floor(parseFloat(sgUSDAmount) * 1_000_000_000)
    );

    // Check if total balance is sufficient
    return sgUSDBalanceValue >= amountUnits;
  };

  // State for NFT receipt modal
  const [showNFTModal, setShowNFTModal] = useState<boolean>(false);
  const [nftData, setNFTData] = useState<{
    amount: string;
    campaignName: string;
    timestamp: number;
    ipfsHash: string;
    objectId?: string;
    message?: string;
    isAnonymous?: boolean;
  } | null>(null);

  // Render appropriate UI based on wallet connection and balance state
  const renderDonationUI = () => {
    // State 1: Wallet not connected
    if (!currentAccount) {
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="sgUSDAmount">Amount (sgUSD)</Label>
          </div>
        </div>
      );
    }

    // Check if user has any sgUSD tokens
    if (formattedCoins.length === 0) {
      // No sgUSD tokens at all
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="sgUSDAmount">Amount (sgUSD)</Label>
              <span className="text-sm text-gray-500">
                Balance: {sgUSDBalance} sgUSD
              </span>
            </div>
            <Input
              id="sgUSDAmount"
              type="number"
              min="0.01"
              step="1"
              value={sgUSDAmount}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setSgUSDAmount(e.target.value)
              }
              placeholder="Enter amount in sgUSD"
            />
          </div>

          <div className="text-amber-600 text-sm">
            You don't have any sgUSD tokens. Mint some tokens to donate.
          </div>

          <Button
            className="w-full bg-black hover:bg-gray-800 text-white"
            onClick={mintSgUSD}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent align-[-0.125em]"></span>
                Processing...
              </>
            ) : (
              "Mint sgUSD (testnet)"
            )}
          </Button>
        </div>
      );
    }

    // State 2b: Has sgUSD tokens but insufficient balance for this donation
    if (!hasEnoughBalance()) {
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="sgUSDAmount">Amount (sgUSD)</Label>
              <span className="text-sm text-gray-500">
                Balance: {sgUSDBalance} sgUSD
              </span>
            </div>
            <Input
              id="sgUSDAmount"
              type="number"
              min="0.01"
              max={parseFloat(sgUSDBalance)}
              step="1"
              value={sgUSDAmount}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setSgUSDAmount(e.target.value)
              }
              placeholder="Enter amount in sgUSD"
            />
          </div>

          <div className="text-amber-600 text-sm">
            Insufficient balance for this donation. Please enter a smaller
            amount or mint more tokens.
          </div>

          <div className="flex space-x-2">
            <Button
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-black"
              onClick={mintSgUSD}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-black border-r-transparent align-[-0.125em]"></span>
                  Processing...
                </>
              ) : (
                "Mint More sgUSD"
              )}
            </Button>
            <Button
              className="flex-1 bg-black hover:bg-gray-800 text-white"
              onClick={() => setSgUSDAmount(sgUSDBalance)}
              disabled={isLoading}
            >
              Use Max Balance
            </Button>
          </div>
        </div>
      );
    }

    // State 3: Wallet connected with sufficient balance
    return (
      <div className="space-y-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="sgUSDAmount">Amount (sgUSD)</Label>
              <span className="text-sm text-gray-500">
                Balance: {sgUSDBalance} sgUSD
              </span>
            </div>
            <Input
              id="sgUSDAmount"
              type="number"
              min="0.01"
              step="1"
              value={sgUSDAmount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSgUSDAmount(e.target.value)
              }
              placeholder="Enter amount in sgUSD"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="donationMessage">Message (optional)</Label>
            <textarea
              id="donationMessage"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={donationMessage}
              onChange={(e) => setDonationMessage(e.target.value)}
              placeholder="Add a message to be included with your donation..."
              maxLength={200}
            />
            <p className="text-xs text-gray-500 text-right">
              {donationMessage.length}/200 characters
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
            />
            <label
              htmlFor="anonymous"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Make this donation anonymous
            </label>
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <Button
            className="w-full bg-black hover:bg-gray-800 text-white"
            onClick={handlePreDonate}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent align-[-0.125em]"></span>
                Processing...
              </>
            ) : (
              "Donate sgUSD (testnet)"
            )}
          </Button>
          
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Need more tokens?</span>
              <span className="text-sm font-medium">{sgUSDBalance} sgUSD available</span>
            </div>
            <Button
              className="w-full bg-gray-200 hover:bg-gray-300 text-black"
              onClick={mintSgUSD}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-black border-r-transparent align-[-0.125em]"></span>
                  Processing...
                </>
              ) : (
                "Mint sgUSD (testnet)"
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Donate to {campaignName}</CardTitle>
          <CardDescription>
            Support this campaign with sgUSD tokens
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">{renderDonationUI()}</CardContent>
      </Card>

      {/* Alert Dialog for Fully Funded Campaign */}
      <AlertDialog open={showFundedAlert} onOpenChange={setShowFundedAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Campaign Fully Funded</AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-2">
                This campaign has already reached its funding goal!
              </p>
              <p className="mb-2">
                Any additional donations will go to the community and contribute to your GiveRep leaderboard score.
              </p>
              <p>
                Would you still like to donate {sgUSDAmount} sgUSD?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={processDonation}>Yes, Donate Anyway</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* NFT Receipt Modal */}
      {nftData && (
        <NFTReceiptModal
          isOpen={showNFTModal}
          onClose={() => {
            setShowNFTModal(false);
            setNFTData(null);
          }}
          donationData={nftData}
        />
      )}
    </>
  );
}
