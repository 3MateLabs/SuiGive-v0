"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

// Define TypeScript interfaces for our data models
interface User {
  id?: string;
  address: string;
  displayName?: string;
  totalDonated?: string;
  donationCount?: number;
  profileImage?: string;
  bio?: string;
  email?: string;
  website?: string;
  twitter?: string;
  discord?: string;
  isPrivate?: boolean;
  showEmail?: boolean;
  showSocial?: boolean;
}

interface Donation {
  id?: string;
  campaignId: string;
  donorAddress: string;
  amount: string;
  currency: string;
  message?: string;
  isAnonymous?: boolean;
  transactionId: string;
  createdAt?: Date | string;
}

interface Campaign {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  currentAmount?: string;
  goalAmount?: string;
  backerCount?: number;
  category?: string;
  creatorAddress?: string;
}

export default function AdminPage() {
  // State for users
  const [users, setUsers] = useState<User[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // State for forms
  const [newUser, setNewUser] = useState<User>({
    address: '',
    displayName: '',
    totalDonated: '1000000000', // 1 SUI in MIST
    donationCount: 1
  });
  
  const [newDonation, setNewDonation] = useState<Donation>({
    campaignId: '',
    donorAddress: '',
    amount: '1000000000', // 1 SUI in MIST
    currency: 'SUI',
    message: 'Test donation',
    isAnonymous: false,
    transactionId: `test-${Date.now()}`
  });

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch users
        const usersResponse = await fetch('/api/admin/users');
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
        
        // Fetch donations
        const donationsResponse = await fetch('/api/admin/donations');
        const donationsData = await donationsResponse.json();
        setDonations(donationsData.donations || []);
        
        // Fetch campaigns
        const campaignsResponse = await fetch('/api/admin/campaigns');
        const campaignsData = await campaignsResponse.json();
        setCampaigns(campaignsData.campaigns || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  // Handle form submissions
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });
      
      if (response.ok) {
        // Refresh users list
        const usersResponse = await fetch('/api/admin/users');
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
        
        // Reset form
        setNewUser({
          address: '',
          displayName: '',
          totalDonated: '1000000000',
          donationCount: 1
        });
        
        alert('User added successfully!');
      } else {
        alert('Failed to add user');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Error adding user');
    }
  };
  
  const handleUpdateDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDonation),
      });
      
      if (response.ok) {
        // Refresh donations list
        const donationsResponse = await fetch('/api/admin/donations');
        const donationsData = await donationsResponse.json();
        setDonations(donationsData.donations || []);
        
        // Reset form
        setNewDonation({
          ...newDonation,
          transactionId: `test-${Date.now()}`
        });
        
        alert('Donation updated successfully!');
      } else {
        alert('Failed to update donation');
      }
    } catch (error) {
      console.error('Error updating donation:', error);
      alert('Error updating donation');
    }
  };
  
  // Format amount for display
  const formatAmount = (amount: string) => {
    try {
      const numAmount = parseFloat(amount) / 1_000_000_000; // Convert from MIST to SUI
      return `${numAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} SUI`;
    } catch (error) {
      return 'Invalid amount';
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Database Admin</h1>
      
      {/* Quick Actions */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Admin tools and management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => window.location.href = '/admin/proposals'}
                className="w-full"
              >
                Campaign Proposals
              </Button>
              <Button 
                onClick={() => window.location.href = '/create'}
                className="w-full"
                variant="outline"
              >
                Create Campaign (Direct)
              </Button>
              <Button 
                onClick={() => window.location.href = '/admin/setup'}
                className="w-full"
                variant="outline"
              >
                Contract Setup
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="view" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="view">View Data</TabsTrigger>
          <TabsTrigger value="add">Add Test Data</TabsTrigger>
        </TabsList>
        
        <TabsContent value="view">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Users Card */}
            <Card>
              <CardHeader>
                <CardTitle>Users ({users.length})</CardTitle>
                <CardDescription>All users in the database</CardDescription>
              </CardHeader>
              <CardContent className="max-h-96 overflow-y-auto">
                {loading ? (
                  <p>Loading users...</p>
                ) : users.length > 0 ? (
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.address} className="p-4 border rounded-lg mb-2 flex justify-between items-center">
                        <div>
                          <p className="font-bold">{user.address ? `${user.address.slice(0, 8)}...${user.address.slice(-6)}` : 'Unknown'}</p>
                          <p>Name: {user.displayName || 'Anonymous'}</p>
                          <p>Total Donated: {formatAmount(user.totalDonated || '0')} SUI</p>
                          <p>Donations: {user.donationCount || 0}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No users found</p>
                )}
              </CardContent>
            </Card>
            
            {/* Donations Card */}
            <Card>
              <CardHeader>
                <CardTitle>Donations ({donations.length})</CardTitle>
                <CardDescription>Recent donations</CardDescription>
              </CardHeader>
              <CardContent className="max-h-96 overflow-y-auto">
                {loading ? (
                  <p>Loading donations...</p>
                ) : donations.length > 0 ? (
                  <div className="space-y-4">
                    {donations.map((donation) => (
                      <div key={donation.id || donation.transactionId} className="p-4 border rounded-lg mb-2">
                        <p className="font-bold">ID: {donation.id || donation.transactionId}</p>
                        <p>Campaign: {donation.campaignId}</p>
                        <p>Donor: {donation.donorAddress ? `${donation.donorAddress.slice(0, 8)}...${donation.donorAddress.slice(-6)}` : 'Unknown'}</p>
                        <p>Amount: {formatAmount(donation.amount)} {donation.currency}</p>
                        <p>Date: {donation.createdAt ? new Date(donation.createdAt).toLocaleString() : 'Unknown'}</p>
                        <p>Message: {donation.message || 'No message'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No donations found</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="add">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Add User Form */}
            <Card>
              <CardHeader>
                <CardTitle>Add Test User</CardTitle>
                <CardDescription>Create a test user in the database</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Wallet Address</Label>
                    <Input 
                      id="address" 
                      value={newUser.address}
                      onChange={(e) => setNewUser({...newUser, address: e.target.value})}
                      placeholder="0x123..."
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input 
                      id="displayName" 
                      value={newUser.displayName}
                      onChange={(e) => setNewUser({...newUser, displayName: e.target.value})}
                      placeholder="User Name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="totalDonated">Total Donated (MIST)</Label>
                    <Input 
                      id="totalDonated" 
                      value={newUser.totalDonated}
                      onChange={(e) => setNewUser({...newUser, totalDonated: e.target.value})}
                      placeholder="1000000000"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      {formatAmount(newUser.totalDonated || '0')}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="donationCount">Donation Count</Label>
                    <Input 
                      id="donationCount" 
                      type="number"
                      value={newUser.donationCount}
                      onChange={(e) => setNewUser({...newUser, donationCount: parseInt(e.target.value)})}
                      placeholder="1"
                      required
                    />
                  </div>
                  
                  <Button type="submit" className="w-full">Add User</Button>
                </form>
              </CardContent>
            </Card>
            
            {/* Add Donation Form */}
            <Card>
              <CardHeader>
                <CardTitle>Add Test Donation</CardTitle>
                <CardDescription>Create a test donation in the database</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateDonation} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="campaignId">Campaign ID</Label>
                    <Input 
                      id="campaignId" 
                      value={newDonation.campaignId}
                      onChange={(e) => setNewDonation({...newDonation, campaignId: e.target.value})}
                      placeholder="0x123..."
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="donorAddress">Donor Address</Label>
                    <Input 
                      id="donorAddress" 
                      value={newDonation.donorAddress}
                      onChange={(e) => setNewDonation({...newDonation, donorAddress: e.target.value})}
                      placeholder="0x123..."
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (MIST)</Label>
                    <Input 
                      id="amount" 
                      value={newDonation.amount}
                      onChange={(e) => setNewDonation({...newDonation, amount: e.target.value})}
                      placeholder="1000000000"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      {formatAmount(newDonation.amount || '0')}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message" 
                      value={newDonation.message}
                      onChange={(e) => setNewDonation({...newDonation, message: e.target.value})}
                      placeholder="Thank you for your work!"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <Label htmlFor="isAnonymous">Anonymous</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <Checkbox 
                        id="isAnonymous" 
                        checked={newDonation.isAnonymous || false} 
                        onCheckedChange={(checked) => setNewDonation({...newDonation, isAnonymous: checked === true})} 
                      />
                      <Label htmlFor="isAnonymous">Hide donor identity</Label>
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full">Add Donation</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
