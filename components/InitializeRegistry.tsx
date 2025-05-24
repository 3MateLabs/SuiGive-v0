"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { CheckCircle, Info, Terminal, Copy, ExternalLink } from "lucide-react";
import { SUI_CONFIG } from "../lib/sui-config";
import { useWallets, useSuiClient } from "@mysten/dapp-kit";
import { WalletConnectButton } from "./WalletConnectButton";
import { initializeRegistry } from "../lib/sui-campaigns";

export default function InitializeRegistry() {
  const [registryId, setRegistryId] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const suiClient = useSuiClient();
  const wallets = useWallets();
  // Find a wallet that supports the Sui sign and execute transaction feature
  const walletForTx = wallets.find((w: any) =>
    w.features && typeof w.features['sui:signAndExecuteTransactionBlock']?.signAndExecuteTransactionBlock === 'function'
  );

  // Wallet-based initialization handler
  const handleInitializeRegistry = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      if (!walletForTx) {
        throw new Error("No compatible wallet found. Please connect a supported Sui wallet.");
      }
      // Pass the wallet object to initializeRegistry; it should use the features property to sign/execute
      const newRegistryId = await initializeRegistry(walletForTx, suiClient);
      setRegistryId(newRegistryId);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Failed to initialize Registry. Try again or use the CLI method below.");
    } finally {
      setLoading(false);
    }
  };


  const handleCopyCommand = () => {
    const command = `sui client call --package ${SUI_CONFIG.PACKAGE_ID} --module crowdfunding --function init --gas-budget 10000000`;
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualUpdate = () => {
    if (registryId) {
      const configUpdate = `REGISTRY_ID: '${registryId}'`;
      navigator.clipboard.writeText(configUpdate);
      alert("Config line copied to clipboard!");
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Initialize SuiGive Registry</CardTitle>
        <CardDescription>
          Create a new Registry object for the enhanced SuiGive contract
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {success ? (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Registry Initialized</AlertTitle>
              <AlertDescription className="text-green-700">
                Registry successfully initialized!<br />
                <span className="font-mono">{registryId}</span>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert className="mb-6 bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Wallet-Based Initialization</AlertTitle>
                <AlertDescription className="text-blue-700">
                  Connect your wallet and click the button below to initialize the Registry directly from the browser.<br />
                  <span className="font-semibold">Recommended for compatible Sui wallets.</span>
                </AlertDescription>
              </Alert>
              <div className="flex flex-col gap-4 items-center">
                <WalletConnectButton />
                <Button
                  disabled={!walletForTx || loading}
                  onClick={handleInitializeRegistry}
                  className="w-full max-w-xs"
                >
                  {loading ? "Initializing..." : "Initialize Registry via Wallet"}
                </Button>
                {error && (
                  <div className="text-red-600 text-sm mt-2">{error}</div>
                )}
              </div>
            </>
          )}
          <div className="mt-8">
            <Alert className="mb-4 bg-gray-50 border-gray-200">
              <Terminal className="h-4 w-4 text-gray-600" />
              <AlertTitle className="text-gray-800">CLI Fallback</AlertTitle>
              <AlertDescription className="text-gray-700">
                If you have issues with wallet-based initialization, use the Sui CLI command below.
              </AlertDescription>
            </Alert>
            <div>
              <h3 className="text-sm font-medium mb-2">Step 1: Run this command in your terminal</h3>
              <div className="relative">
                <div className="bg-gray-900 text-gray-100 p-3 rounded-md font-mono text-xs overflow-x-auto">
                  sui client call --package {SUI_CONFIG.PACKAGE_ID} --module crowdfunding --function init --gas-budget 10000000
                </div>
                <button
                  onClick={handleCopyCommand}
                  className="absolute top-2 right-2 p-1 bg-gray-800 rounded-md hover:bg-gray-700 text-gray-300"
                  title="Copy to clipboard"
                >
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Step 2: Enter the Registry ID below (if using CLI)</h3>
              <input
                type="text"
                value={registryId}
                onChange={(e) => setRegistryId(e.target.value)}
                placeholder="Enter Registry ID here"
                className="w-full p-2 border border-gray-300 rounded-md font-mono text-sm"
                disabled={success}
              />
            </div>
            {registryId && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Step 3: Update your config file</h3>
                <p className="text-sm text-gray-500 mb-2">
                  Update the REGISTRY_ID in <code>/lib/sui-config.ts</code> with:
                </p>
                <div className="relative">
                  <div className="bg-gray-100 p-3 rounded-md font-mono text-xs overflow-x-auto">
                    REGISTRY_ID: '{registryId}'
                  </div>
                  <button
                    onClick={handleManualUpdate}
                    className="absolute top-2 right-2 p-1 bg-gray-200 rounded-md hover:bg-gray-300 text-gray-700"
                    title="Copy to clipboard"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <a
          href="https://docs.sui.io/build/cli-client"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          Sui CLI Documentation
        </a>
        <a
          href={`https://explorer.sui.io/object/${SUI_CONFIG.PACKAGE_ID}?network=testnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          View Package in Explorer
        </a>
      </CardFooter>
    </Card>
  );
}

