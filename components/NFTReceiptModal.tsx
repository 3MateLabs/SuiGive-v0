"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, Download, X } from 'lucide-react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

interface NFTReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  donationData: {
    amount: string;
    campaignName: string;
    timestamp: number;
    ipfsHash: string;
    objectId?: string;
  };
}

export default function NFTReceiptModal({ isOpen, onClose, donationData }: NFTReceiptModalProps) {
  console.log('NFTReceiptModal rendered with props:', { isOpen, donationData });
  const { amount, campaignName, timestamp, ipfsHash, objectId } = donationData;
  
  // Format the timestamp to a relative time (e.g., "2 minutes ago")
  const timeAgo = timestamp ? formatDistanceToNow(new Date(timestamp), { addSuffix: true }) : 'just now';
  
  // List of IPFS gateways to try
  const ipfsGateways = [
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://dweb.link/ipfs/'
  ];

  const [currentGatewayIndex, setCurrentGatewayIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  // Get current IPFS URL
  const ipfsUrl = `${ipfsGateways[currentGatewayIndex]}${ipfsHash}`;

  // Handle image load error
  const handleImageError = () => {
    if (currentGatewayIndex < ipfsGateways.length - 1) {
      // Try next gateway
      setCurrentGatewayIndex(currentGatewayIndex + 1);
    } else {
      // All gateways failed, show placeholder
      setImageError(true);
    }
  };
  
  // Function to handle sharing
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My SuiGive Donation NFT',
          text: `I just donated ${amount} sgUSD to ${campaignName} on SuiGive!`,
          url: window.location.href,
        });
      } else {
        // Fallback for browsers that don't support the Web Share API
        navigator.clipboard.writeText(
          `I just donated ${amount} sgUSD to ${campaignName} on SuiGive! Check it out: ${window.location.href}`
        );
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Function to view on explorer
  const viewOnExplorer = () => {
    if (objectId) {
      window.open(`https://explorer.sui.io/object/${objectId}`, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Donation Receipt NFT
          </DialogTitle>
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6 py-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative w-full max-w-[280px] aspect-square rounded-xl overflow-hidden shadow-lg"
          >
            {!imageError ? (
              <Image
                src={ipfsUrl}
                alt="Donation NFT"
                fill
                className="object-cover"
                priority
                onError={handleImageError}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 text-center">
                <div>
                  <h3 className="text-xl font-bold mb-2">SuiGive Donation NFT</h3>
                  <p className="text-sm opacity-80">Thank you for your contribution!</p>
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
              <div className="p-4 text-white">
                <p className="text-sm font-medium">SuiGive Donation</p>
                <p className="text-xs opacity-80">{timeAgo}</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-center space-y-2"
          >
            <h3 className="text-xl font-semibold">Thank you for your generosity!</h3>
            <p className="text-gray-600">
              You donated <span className="font-bold">{amount} sgUSD</span> to <span className="font-bold">{campaignName}</span>
            </p>
            <p className="text-sm text-gray-500">
              This NFT is a permanent record of your contribution on the Sui blockchain
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="flex flex-wrap gap-3 justify-center"
          >
            {objectId && (
              <Button
                variant="outline"
                onClick={() => window.open(`https://suiexplorer.com/object/${objectId}`, '_blank')}
                className="flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                View on Explorer
              </Button>
            )}
            <Button 
              variant="outline" 
              className="flex items-center gap-2" 
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            
            {objectId && (
              <Button 
                variant="outline" 
                className="flex items-center gap-2" 
                onClick={viewOnExplorer}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM11 7H13V9H11V7ZM11 11H13V17H11V11Z" fill="currentColor"/>
                </svg>
                View on Explorer
              </Button>
            )}
            
            <Button 
              className="bg-sui-navy hover:bg-sui-navy/90 text-white flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download NFT
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
