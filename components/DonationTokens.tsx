"use client";

import { useState } from 'react';
import { useSuiTokens } from '@/hooks/useSuiTokens';
import { formatSUI } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export function DonationTokens() {
  const { 
    donationTokens, 
    loading, 
    error, 
    isWalletConnected, 
    transferDonationTokenToAddress 
  } = useSuiTokens();
  
  const [recipient, setRecipient] = useState('');
  const [selectedTokenId, setSelectedTokenId] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  
  const handleTransfer = async () => {
    if (!recipient || !selectedTokenId) {
      toast.error('Please enter a valid recipient address');
      return;
    }
    
    const success = await transferDonationTokenToAddress(selectedTokenId, recipient);
    if (success) {
      setShowTransferModal(false);
      setRecipient('');
      setSelectedTokenId('');
    }
  };
  
  const openTransferModal = (tokenId: string) => {
    setSelectedTokenId(tokenId);
    setShowTransferModal(true);
  };
  
  if (!isWalletConnected) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Your Donation Tokens</h2>
        <p className="text-gray-600">Please connect your wallet to view your donation tokens.</p>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Your Donation Tokens</h2>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sui-navy"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Your Donation Tokens</h2>
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold mb-4">Your Donation Tokens</h2>
      
      {donationTokens.length === 0 ? (
        <p className="text-gray-600">You don't have any donation tokens yet. Donate to a campaign to receive tokens!</p>
      ) : (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            These tokens represent your donations to campaigns. You can transfer them to other addresses.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {donationTokens.map((token) => (
              <div key={token.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">Donation Token</h3>
                    <p className="text-sm text-gray-500 truncate">ID: {token.id.substring(0, 8)}...{token.id.substring(token.id.length - 4)}</p>
                    <p className="mt-2 text-lg font-semibold">{formatSUI(token.amount)} SUI</p>
                    <p className="text-sm text-gray-500">Campaign: {token.campaignId.substring(0, 8)}...{token.campaignId.substring(token.campaignId.length - 4)}</p>
                  </div>
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Transferable
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => openTransferModal(token.id)}
                  className="mt-4 w-full py-2 px-4 bg-sui-navy text-white rounded-md hover:bg-sui-navy/90 transition-colors"
                >
                  Transfer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Transfer Donation Token</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter the recipient's address to transfer your donation token.
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
    </div>
  );
}
