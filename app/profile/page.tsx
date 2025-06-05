import React from 'react';
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import DonationHistory from '@/components/DonationHistory';
import UserProfile from '@/components/UserProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProfilePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <UserProfile editable={true} showDonations={true} showCampaigns={true} />
          </div>
          
          <div className="lg:col-span-2">
            <Tabs defaultValue="donations" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="donations">Donation History</TabsTrigger>
                <TabsTrigger value="stats">Your Impact</TabsTrigger>
                <TabsTrigger value="campaigns">Created Campaigns</TabsTrigger>
              </TabsList>
              
              <TabsContent value="donations">
                <DonationHistory />
              </TabsContent>
              
              <TabsContent value="stats">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Impact</CardTitle>
                    <CardDescription>
                      Track your contributions and impact on SuiGive
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Your donation history and statistics are securely tracked on SuiGive, allowing you to see your impact over time.
                      All donations are recorded on the Sui blockchain for transparency and security.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <Card className="bg-primary/5">
                        <CardHeader className="pb-2">
                          <CardDescription>Total Campaigns Supported</CardDescription>
                          <CardTitle className="text-2xl">Coming Soon</CardTitle>
                        </CardHeader>
                      </Card>
                      
                      <Card className="bg-primary/5">
                        <CardHeader className="pb-2">
                          <CardDescription>Total Impact</CardDescription>
                          <CardTitle className="text-2xl">Coming Soon</CardTitle>
                        </CardHeader>
                      </Card>
                      
                      <Card className="bg-primary/5">
                        <CardHeader className="pb-2">
                          <CardDescription>Donation Streak</CardDescription>
                          <CardTitle className="text-2xl">Coming Soon</CardTitle>
                        </CardHeader>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="campaigns">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Created Campaigns</CardTitle>
                    <CardDescription>
                      Campaigns you've created on SuiGive
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div id="created-campaigns-list" className="space-y-4">
                      {/* Campaigns will be loaded from the user profile */}
                      <p className="text-gray-500">Connect your wallet to view your created campaigns</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
