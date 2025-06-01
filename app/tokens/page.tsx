import React from 'react';
import SgUSDTokens from '@/components/SgUSDTokens';
import SgSuiTokens from '@/components/SgSuiTokens';
import SuiProviders from '@/components/SuiProviders';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TokensPage() {
  return (
    <SuiProviders>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-center mb-8">SuiGive Token Management</h1>
        
        <Tabs defaultValue="sgusd" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="sgusd">sgUSD Tokens</TabsTrigger>
            <TabsTrigger value="sgsui">sgSUI Tokens</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sgusd" className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <SgUSDTokens />
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">About sgUSD</h2>
              <p className="mb-4">
                sgUSD is a stablecoin used exclusively on the SuiGive platform.
                It allows donors to make contributions to campaigns using a token that represents
                their reputation and commitment to charitable causes.
              </p>
              
              <h3 className="text-xl font-semibold mt-6 mb-2">Benefits</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Gas-efficient donations</li>
                <li>Special NFT receipts for sgUSD donations</li>
                <li>Track your reputation and impact in the SuiGive ecosystem</li>
                <li>Campaign creators can redeem sgUSD for various benefits</li>
              </ul>
              
              <h3 className="text-xl font-semibold mt-6 mb-2">How to Use</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Mint sgUSD tokens using the form on the left</li>
                <li>Navigate to a campaign you want to support</li>
                <li>Select "Donate with sgUSD" option</li>
                <li>Track your donations in your wallet</li>
              </ol>
            </div>
          </TabsContent>
          
          <TabsContent value="sgsui" className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <SgSuiTokens />
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">About sgSUI</h2>
              <p className="mb-4">
                sgSUI is a wrapped version of SUI used for distributing funds from campaigns to service providers.
                It provides a secure and transparent way to track how funds are being used after a campaign reaches its goal.
              </p>
              
              <h3 className="text-xl font-semibold mt-6 mb-2">Benefits</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Transparent fund distribution</li>
                <li>Secure payments to service providers</li>
                <li>Track how campaign funds are being utilized</li>
                <li>Redeemable for SUI tokens</li>
              </ul>
              
              <h3 className="text-xl font-semibold mt-6 mb-2">How sgSUI Works</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Campaign creators distribute funds to service providers using sgSUI</li>
                <li>Service providers receive sgSUI tokens</li>
                <li>sgSUI can be redeemed for SUI or transferred to other addresses</li>
                <li>All transactions are recorded on the Sui blockchain for transparency</li>
              </ol>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SuiProviders>
  );
}
