"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { DonationReceipt } from '@/lib/sui-receipts';
import { formatSUI } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';

interface DonationNFTCardProps {
  receipt: DonationReceipt;
  campaignName?: string;
  imageUrl?: string;
}

export default function DonationNFTCard({ receipt, campaignName, imageUrl }: DonationNFTCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Format timestamp to readable date
  const formatDate = (timestamp: string) => {
    if (!timestamp) return 'Unknown date';
    try {
      const timestampNum = parseInt(timestamp, 10);
      const date = new Date(timestampNum * 1000);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Unknown date';
    }
  };
  
  // Generate a unique gradient based on receipt ID
  const generateGradient = (id: string) => {
    // Use the last 6 characters of the ID to create a unique color
    const hash = id.slice(-6);
    const hue1 = parseInt(hash.slice(0, 2), 16) % 360;
    const hue2 = (hue1 + 40) % 360;
    return `linear-gradient(135deg, hsl(${hue1}, 80%, 60%), hsl(${hue2}, 80%, 50%))`;
  };
  
  // Use the IPFS-hosted image for all donation NFTs
  const nftImageUrl = imageUrl || receipt.imageUrl || 'https://ipfs.io/ipfs/bafkreiap7rugqtnfnw5nlui4aavtrj6zrqbxzzanq44sxnztktm3kzdufi';
  
  // Short version of campaign ID
  const shortCampaignId = receipt.campaignId 
    ? `${receipt.campaignId.slice(0, 6)}...${receipt.campaignId.slice(-4)}`
    : '';
    
  // Short version of receipt ID
  const shortReceiptId = receipt.id 
    ? `${receipt.id.slice(0, 6)}...${receipt.id.slice(-4)}`
    : '';
  
  return (
    <div 
      className="relative w-full h-64 rounded-xl overflow-hidden shadow-md transition-all duration-500 cursor-pointer group"
      onClick={() => setIsFlipped(!isFlipped)}
      style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
    >
      {/* Front of the card */}
      <div 
        className={`absolute inset-0 w-full h-full rounded-xl p-4 flex flex-col justify-between transition-all duration-500 backface-visibility-hidden ${isFlipped ? 'opacity-0 rotate-y-180' : 'opacity-100'}`}
        style={{ 
          background: nftImageUrl ? 'transparent' : generateGradient(receipt.id),
          backfaceVisibility: 'hidden'
        }}
      >
        {nftImageUrl && (
          <div className="absolute inset-0 w-full h-full overflow-hidden rounded-xl">
            <Image 
              src={nftImageUrl} 
              alt={`Donation receipt for ${campaignName || 'campaign'}`}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          </div>
        )}
        <div className="flex justify-between items-start">
          <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-medium">
            Donation Receipt
          </div>
          <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-medium">
            {formatSUI(receipt.amount)} SUI
          </div>
        </div>
        
        <div className="mt-auto">
          <h3 className="text-white font-bold text-lg mb-1">
            {campaignName || 'Campaign Donation'}
          </h3>
          <p className="text-white/80 text-sm mb-2">
            {formatDate(receipt.timestamp)}
          </p>
          <div className="flex items-center gap-2">
            <div className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded text-white text-xs">
              NFT ID: {shortReceiptId}
            </div>
          </div>
        </div>
      </div>
      
      {/* Back of the card */}
      <div 
        className={`absolute inset-0 w-full h-full rounded-xl p-4 flex flex-col bg-white transition-all duration-500 backface-visibility-hidden ${isFlipped ? 'opacity-100 rotate-y-0' : 'opacity-0 rotate-y-180'}`}
        style={{ 
          backfaceVisibility: 'hidden',
          transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(180deg)'
        }}
      >
        <div className="flex flex-col h-full">
          <h3 className="font-bold text-[#0a2233] text-lg mb-2">Donation Details</h3>
          
          <div className="space-y-2 text-sm flex-1">
            <div>
              <span className="text-gray-500">Amount:</span>
              <span className="ml-2 font-medium">{formatSUI(receipt.amount)} SUI</span>
            </div>
            <div>
              <span className="text-gray-500">Date:</span>
              <span className="ml-2 font-medium">{formatDate(receipt.timestamp)}</span>
            </div>
            <div>
              <span className="text-gray-500">Campaign ID:</span>
              <span className="ml-2 font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">{shortCampaignId}</span>
            </div>
            <div>
              <span className="text-gray-500">Receipt ID:</span>
              <span className="ml-2 font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">{shortReceiptId}</span>
            </div>
            {receipt.message && (
              <div>
                <span className="text-gray-500">Message:</span>
                <p className="mt-1 text-gray-700 italic bg-gray-50 p-2 rounded text-xs">
                  "{receipt.message}"
                </p>
              </div>
            )}
          </div>
          
          <div className="mt-auto pt-2 border-t border-gray-100">
            <Link 
              href={`https://explorer.sui.io/object/${receipt.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              View on Sui Explorer →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
