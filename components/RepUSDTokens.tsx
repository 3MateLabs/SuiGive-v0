import React, { useState, useEffect } from 'react';
import { useCurrentAccount, useSignTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { SUI_CONFIG } from '@/lib/sui-config';
import { toast } from 'react-hot-toast';

export default function RepUSDTokens() {
  const currentAccount = useCurrentAccount();
  const { mutate: signTransaction } = useSignTransaction();
  const client = useSuiClient();
  const [amount, setAmount] = useState<number>(100);
  const [loading, setLoading] = useState<boolean>(false);
  const [repUSDBalance, setRepUSDBalance] = useState<string>('0');
  const [managerObject, setManagerObject] = useState<string | null>(null);

  // Fetch RepUSD Manager object and user's RepUSD balance
  useEffect(() => {
    const fetchRepUSDData = async () => {
      try {
        // Query for RepUSD_Manager objects
        const managers = await client.getOwnedObjects({
          owner: SUI_CONFIG.DEPLOYER_ADDRESS,
          options: { showContent: true },
          filter: {
            StructType: `${SUI_CONFIG.PACKAGE_ID}::rep_usd::REPUSD_Manager`
          }
        });

        if (managers.data && managers.data.length > 0) {
          setManagerObject(managers.data[0].data?.objectId || null);
        }

        // Only fetch balance if we have a connected wallet
        if (currentAccount?.address) {
          const coins = await client.getCoins({
            owner: currentAccount.address,
            coinType: `${SUI_CONFIG.PACKAGE_ID}::rep_usd::REPUSD`
          });

          // Calculate total balance
          const total = coins.data.reduce((acc, coin) => acc + BigInt(coin.balance), BigInt(0));
          setRepUSDBalance(formatBalance(total));
        }
      } catch (error) {
        console.error('Error fetching RepUSD data:', error);
      }
    };

    fetchRepUSDData();
  }, [client, currentAccount]);

  // Format balance with proper decimals
  const formatBalance = (balance: bigint): string => {
    const balanceStr = balance.toString().padStart(10, '0');
    const integerPart = balanceStr.slice(0, -9) || '0';
    const decimalPart = balanceStr.slice(-9);
    return `${integerPart}.${decimalPart.substring(0, 2)}`;
  };

  // Mint RepUSD tokens
  const mintRepUSD = async () => {
    if (!currentAccount || !managerObject) {
      toast.error('Wallet not connected or RepUSD Manager not found');
      return;
    }

    try {
      setLoading(true);

      // Create transaction
      const tx = new Transaction();
      
      // Convert amount to the correct denomination (9 decimals)
      const mintAmount = BigInt(amount) * BigInt(1000000000);
      
      // Call the mint function
      tx.moveCall({
        target: `${SUI_CONFIG.PACKAGE_ID}::rep_usd::mint`,
        arguments: [
          tx.object(managerObject),
          tx.pure.u64(mintAmount.toString()),
          tx.pure.address(currentAccount.address),
        ],
      });

      // Sign and execute the transaction
      const result = await signTransaction({
        transaction: tx,
      });

      console.log('Mint transaction signed:', result);
      toast.success(`Transaction signed! RepUSD tokens will be minted shortly.`);
      
      // Refresh balance after a short delay to allow transaction to process
      setTimeout(async () => {
        try {
          const coins = await client.getCoins({
            owner: currentAccount.address,
            coinType: `${SUI_CONFIG.PACKAGE_ID}::rep_usd::REPUSD`
          });
          
          const total = coins.data.reduce((acc, coin) => acc + BigInt(coin.balance), BigInt(0));
          setRepUSDBalance(formatBalance(total));
        } catch (err) {
          console.error('Error refreshing balance:', err);
        }
      }, 5000);
    } catch (error) {
      console.error('Error minting RepUSD:', error);
      toast.error('Failed to mint RepUSD tokens');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">RepUSD Tokens</h2>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-md">
        <p className="text-sm text-gray-600">Current Balance:</p>
        <p className="text-xl font-semibold">{repUSDBalance} RepUSD</p>
      </div>
      
      <div className="mb-4">
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
          Amount to Mint
        </label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          min="1"
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      
      <button
        onClick={mintRepUSD}
        disabled={loading || !currentAccount || !managerObject}
        className={`w-full py-2 px-4 rounded-md text-white font-medium ${
          loading || !currentAccount || !managerObject
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {loading ? (
          <>
            <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent align-[-0.125em]"></span>
            Minting...
          </>
        ) : 'Mint RepUSD Tokens'}
      </button>
      
      {!currentAccount && (
        <p className="mt-2 text-sm text-red-600">
          Please connect your wallet to mint RepUSD tokens
        </p>
      )}
      
      {!managerObject && currentAccount && (
        <p className="mt-2 text-sm text-red-600">
          RepUSD Manager not found. Contract may not be deployed yet.
        </p>
      )}
      
      <div className="mt-6 text-sm text-gray-600">
        <p>RepUSD is a reputation-based stablecoin for donations on SuiGive.</p>
        <p className="mt-1">Use these tokens to support campaigns and receive special NFT receipts.</p>
      </div>
    </div>
  );
}
