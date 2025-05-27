"use client";

import { useState } from 'react';
import { useSuiTokens } from '@/hooks/useSuiTokens';
import { formatSUI } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { SUI_CONFIG } from '@/lib/sui-config';

export default function SgSuiTokens() {
  const { 
    sgSuiTokens, 
    loading, 
    error, 
    isWalletConnected, 
    transferSgSuiTokensToAddress,
    redeemSgSuiTokensForSui
  } = useSuiTokens();
  
  const [recipient, setRecipient] = useState('');
  const [selectedTokenId, setSelectedTokenId] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [treasuryId, setTreasuryId] = useState(''); // This would be fetched from config or API
  
  const handleTransfer = async () => {
    if (!recipient || !selectedTokenId) {
      toast.error('Please enter a valid recipient address');
      return;
    }
    
    const success = await transferSgSuiTokensToAddress(selectedTokenId, recipient);
    if (success) {
      setShowTransferModal(false);
      setRecipient('');
      setSelectedTokenId('');
    }
  };
  
  const handleRedeem = async () => {
    if (!selectedTokenId || !treasuryId) {
      toast.error('Missing required information for redemption');
      return;
    }
    
    // Find the selected token to get its campaignId
    const selectedToken = sgSuiTokens.find(token => token.id === selectedTokenId);
    if (!selectedToken) {
      toast.error('Selected token not found');
      return;
    }
    
    const success = await redeemSgSuiTokensForSui(treasuryId, selectedTokenId, selectedToken.campaignId);
    if (success) {
      setShowRedeemModal(false);
      setSelectedTokenId('');
    }
  };
  
  const openTransferModal = (tokenId: string) => {
    setSelectedTokenId(tokenId);
    setShowTransferModal(true);
  };
  
  const openRedeemModal = (tokenId: string) => {
    // Use the Treasury ID from our configuration
    setTreasuryId(SUI_CONFIG.TREASURY_CAP_ID);
    setSelectedTokenId(tokenId);
    setShowRedeemModal(true);
  };
  
  if (!isWalletConnected) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Your sgSUI Tokens</h2>
        <p className="text-gray-600">Please connect your wallet to view your sgSUI tokens.</p>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Your sgSUI Tokens</h2>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sui-navy"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Your sgSUI Tokens</h2>
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold mb-4">Your sgSUI Tokens</h2>
      
      {sgSuiTokens.length === 0 ? (
        <p className="text-gray-600">You don't have any sgSUI tokens yet. These tokens are distributed by campaign creators to service providers.</p>
      ) : (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            These tokens represent funds from campaigns that can be redeemed for SUI or transferred to other addresses.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sgSuiTokens.map((token) => (
              <div key={token.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">sgSUI Token</h3>
                    <p className="text-sm text-gray-500 truncate">ID: {token.id.substring(0, 8)}...{token.id.substring(token.id.length - 4)}</p>
                    <p className="mt-2 text-lg font-semibold">{formatSUI(token.amount)} sgSUI</p>
                    <p className="text-sm text-gray-500">Campaign: {token.campaignId.substring(0, 8)}...{token.campaignId.substring(token.campaignId.length - 4)}</p>
                  </div>
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Redeemable
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => openTransferModal(token.id)}
                    className="py-2 px-4 bg-sui-navy text-white rounded-md hover:bg-sui-navy/90 transition-colors"
                  >
                    Transfer
                  </button>
                  <button
                    onClick={() => openRedeemModal(token.id)}
                    className="py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Redeem
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Transfer sgSUI Token</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter the recipient's address to transfer your sgSUI token.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipient Address
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sui-navy"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                className="px-4 py-2 bg-sui-navy text-white rounded-md hover:bg-sui-navy/90"
              >
                Transfer
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Redeem Modal */}
      {showRedeemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Redeem sgSUI Token</h3>
            <p className="text-sm text-gray-600 mb-4">
              You are about to redeem your sgSUI token for SUI. This action cannot be undone.
            </p>
            
            <div className="p-4 bg-gray-50 rounded-md mb-4">
              <p className="text-sm font-medium">Token Details</p>
              <p className="text-sm text-gray-600">ID: {selectedTokenId.substring(0, 8)}...{selectedTokenId.substring(selectedTokenId.length - 4)}</p>
              <p className="text-sm text-gray-600">
                Amount: {sgSuiTokens.find(t => t.id === selectedTokenId)?.amount 
                  ? formatSUI(sgSuiTokens.find(t => t.id === selectedTokenId)!.amount) 
                  : '0'} SUI
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRedeemModal(false)}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRedeem}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Redeem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
