"use client";

import { useState, useEffect } from 'react';
import { useDonationReceipts } from '@/hooks/useDonationReceipts';
import DonationNFTCard from './DonationNFTCard';
import { Button } from './ui/button';
import { RefreshCw } from 'lucide-react';

export default function DonationNFTGallery() {
  const { receipts, loading, error, isWalletConnected, refreshReceipts } = useDonationReceipts();
  const [campaignNames, setCampaignNames] = useState<Record<string, string>>({});
  
  // Fetch campaign names for the receipts
  useEffect(() => {
    // In a real implementation, we would fetch campaign names from the blockchain
    // For now, we'll use mock data
    const mockCampaignNames: Record<string, string> = {
      // Add some example campaign IDs and names
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef': 'Clean Water Project',
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890': 'Healthcare Crowdfund for Alex',
      '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456': 'Community Garden Initiative',
    };
    
    setCampaignNames(mockCampaignNames);
  }, []);
  
  // Get campaign name for a receipt
  const getCampaignName = (campaignId: string) => {
    return campaignNames[campaignId] || 'Campaign';
  };
  
  if (!isWalletConnected) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm text-center">
        <h3 className="text-xl font-bold mb-4 text-[#0a2233]">Your NFT Receipts</h3>
        <div className="p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">Connect your wallet to view your donation NFT receipts</p>
          <Button variant="outline" className="bg-[#0a2233] text-white hover:bg-[#18344a]">
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-xl font-bold mb-4 text-[#0a2233]">Your NFT Receipts</h3>
        <div className="p-8 bg-gray-50 rounded-lg text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#0a2233] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your NFT receipts...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-xl font-bold mb-4 text-[#0a2233]">Your NFT Receipts</h3>
        <div className="p-8 bg-gray-50 rounded-lg text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button 
            variant="outline" 
            className="bg-[#0a2233] text-white hover:bg-[#18344a]"
            onClick={refreshReceipts}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  if (receipts.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-[#0a2233]">Your NFT Receipts</h3>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-1"
            onClick={refreshReceipts}
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>
        <div className="p-8 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-500 mb-4">You haven't made any donations yet</p>
          <Button variant="outline" className="bg-[#0a2233] text-white hover:bg-[#18344a]">
            Explore Campaigns
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-[#0a2233]">Your NFT Receipts</h3>
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-1"
          onClick={refreshReceipts}
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {receipts.map((receipt) => (
          <DonationNFTCard 
            key={receipt.id} 
            receipt={receipt} 
            campaignName={getCampaignName(receipt.campaignId)}
            imageUrl={receipt.imageUrl}
          />
        ))}
      </div>
    </div>
  );
}
