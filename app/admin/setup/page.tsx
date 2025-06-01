"use client";

import { useEffect, useState } from "react";
import { SUI_CONFIG } from "@/lib/sui-config";
import InitializeRegistry from "@/components/InitializeRegistry";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, CheckCircle } from "lucide-react";

export default function SetupPage() {
  const [configStatus, setConfigStatus] = useState({
    packageId: false,
    registryId: false,
    treasuryId: false
  });

  useEffect(() => {
    // Check if the configuration is set up
    setConfigStatus({
      packageId: !!SUI_CONFIG.PACKAGE_ID,
      registryId: !!SUI_CONFIG.REGISTRY_ID,
      treasuryId: !!SUI_CONFIG.TREASURY_ID
    });
  }, []);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">SuiGive Admin Setup</h1>
      
      <div className="grid gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Configuration Status</CardTitle>
            <CardDescription>
              Current status of your SuiGive contract configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${configStatus.packageId ? 'bg-green-100' : 'bg-amber-100'}`}>
                  {configStatus.packageId ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Info className="h-4 w-4 text-amber-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Package ID</p>
                  <p className="text-sm text-gray-500 font-mono break-all">
                    {SUI_CONFIG.PACKAGE_ID || "Not configured"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${configStatus.registryId ? 'bg-green-100' : 'bg-amber-100'}`}>
                  {configStatus.registryId ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Info className="h-4 w-4 text-amber-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Registry ID</p>
                  <p className="text-sm text-gray-500 font-mono break-all">
                    {SUI_CONFIG.REGISTRY_ID || "Not configured - Initialize below"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${configStatus.treasuryId ? 'bg-green-100' : 'bg-amber-100'}`}>
                  {configStatus.treasuryId ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Info className="h-4 w-4 text-amber-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Treasury ID</p>
                  <p className="text-sm text-gray-500 font-mono break-all">
                    {SUI_CONFIG.TREASURY_ID || "Not configured"}
                  </p>
                </div>
              </div>
            </div>
            
            {!configStatus.registryId && (
              <Alert className="mt-6 bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Action Required</AlertTitle>
                <AlertDescription className="text-blue-700">
                  You need to initialize the Registry object to use the SuiGive platform.
                  Use the form below to create it.
                </AlertDescription>
              </Alert>
            )}
            
            {configStatus.registryId && (
              <Alert className="mt-6 bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Ready to Use</AlertTitle>
                <AlertDescription className="text-green-700">
                  Your SuiGive contract is fully configured and ready to use.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
      
      {!configStatus.registryId && (
        <div className="mb-8">
          <InitializeRegistry />
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Manual Configuration</CardTitle>
          <CardDescription>
            If you need to manually update your configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            After initializing the Registry, you&apos;ll need to update the <code>sui-config.ts</code> file with the Registry ID.
            You can copy the ID from the success message above and update the file at:
          </p>
          <p className="font-mono text-xs bg-gray-100 p-3 rounded">
            /lib/sui-config.ts
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
