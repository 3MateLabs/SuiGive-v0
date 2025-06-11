"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { DonationReceipt } from '@/lib/sui-receipts';
import { formatSUI } from '@/lib/utils';
import { ExternalLink, Calendar, Hash, CreditCard, MessageSquare, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Format sgUSD amount
const formatSgUSD = (amount: string) => {
  try {
    const bigAmount = BigInt(amount);
    return (Number(bigAmount) / 1_000_000).toFixed(2);
  } catch {
    return '0.00';
  }
};

interface DonationNFTCardProps {
  receipt: DonationReceipt;
  campaignName?: string;
  imageUrl?: string;
}

export default function DonationNFTCard({ receipt, campaignName, imageUrl }: DonationNFTCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
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
      });
    } catch (e) {
      return 'Unknown date';
    }
  };
  
  // Generate a unique gradient based on receipt ID
  const generateGradient = (id: string) => {
    const hash = id.slice(-6);
    const hue1 = parseInt(hash.slice(0, 2), 16) % 360;
    const hue2 = (hue1 + 40) % 360;
    return `linear-gradient(135deg, hsl(${hue1}, 70%, 55%), hsl(${hue2}, 70%, 45%))`;
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

  const cardVariants = {
    front: {
      rotateY: 0,
      transition: { duration: 0.6, ease: "easeInOut" }
    },
    back: {
      rotateY: 180,
      transition: { duration: 0.6, ease: "easeInOut" }
    }
  };

  const glowVariants = {
    initial: { opacity: 0 },
    hover: { 
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="relative w-full h-72 rounded-2xl cursor-pointer"
      style={{ perspective: '1000px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={isFlipped ? "back" : "front"}
        variants={cardVariants}
      >
        {/* Front of the card */}
        <motion.div 
          className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden backface-hidden"
          style={{ 
            background: nftImageUrl ? 'transparent' : generateGradient(receipt.id),
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(78, 205, 196, 0.3), transparent 70%)',
              filter: 'blur(40px)',
              zIndex: -1,
            }}
            variants={glowVariants}
            initial="initial"
            animate={isHovered ? "hover" : "initial"}
          />

          {nftImageUrl && (
            <div className="absolute inset-0 w-full h-full">
              <Image 
                src={nftImageUrl} 
                alt={`Donation receipt for ${campaignName || 'campaign'}`}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            </div>
          )}
          
          {/* Content overlay */}
          <div className="relative h-full p-6 flex flex-col justify-between">
            {/* Top badges */}
            <div className="flex justify-between items-start">
              <motion.div 
                className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
              >
                <Sparkles className="h-3 w-3 text-white" />
                <span className="text-white text-xs font-medium">NFT Receipt</span>
              </motion.div>
              <motion.div 
                className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
              >
                <CreditCard className="h-3 w-3 text-white" />
                <span className="text-white text-sm font-semibold">${formatSgUSD(receipt.amount)}</span>
              </motion.div>
            </div>
            
            {/* Bottom content */}
            <div className="space-y-3">
              <motion.h3 
                className="text-white font-bold text-xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {campaignName || 'Campaign Donation'}
              </motion.h3>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg">
                  <Calendar className="h-3 w-3 text-white/80" />
                  <span className="text-white/90 text-xs">{formatDate(receipt.timestamp)}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg">
                  <Hash className="h-3 w-3 text-white/80" />
                  <span className="text-white/90 text-xs font-mono">{shortReceiptId}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Back of the card */}
        <motion.div 
          className="absolute inset-0 w-full h-full rounded-2xl p-6 bg-gradient-to-br from-white to-gray-50 shadow-xl backface-hidden"
          style={{ 
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 text-lg">Donation Details</h3>
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
                className="p-2 bg-gray-100 rounded-lg"
              >
                <Hash className="h-4 w-4 text-gray-600" />
              </motion.div>
            </div>
            
            {/* Details */}
            <div className="space-y-4 flex-1">
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Amount
                  </span>
                  <span className="font-semibold text-gray-900">${formatSgUSD(receipt.amount)} sgUSD</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date
                  </span>
                  <span className="font-medium text-gray-700">{formatDate(receipt.timestamp)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm">
                  <p className="text-gray-500 mb-1">Campaign ID</p>
                  <p className="font-mono text-xs bg-gray-100 px-3 py-2 rounded-lg text-gray-700">{shortCampaignId}</p>
                </div>
                
                <div className="text-sm">
                  <p className="text-gray-500 mb-1">Receipt ID</p>
                  <p className="font-mono text-xs bg-gray-100 px-3 py-2 rounded-lg text-gray-700">{shortReceiptId}</p>
                </div>
              </div>
              
              {receipt.message && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 mb-1">Your Message</p>
                      <p className="text-sm text-blue-700 italic">"{receipt.message}"</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <motion.div className="mt-4 pt-4 border-t border-gray-200">
              <Link 
                href={`https://explorer.sui.io/object/${receipt.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <span>View on Explorer</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}