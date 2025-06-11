"use client";

import React, { useState } from 'react';
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import DonationHistory from '@/components/DonationHistory';
import UserProfile from '@/components/UserProfile';
import ProfileAnalytics from '@/components/ProfileAnalytics';
import DonationNFTGallery from '@/components/DonationNFTGallery';
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from "@/components/ui/modern-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useUserProfile } from '@/hooks/useUserProfile';
import { LayoutDashboard, Receipt, Trophy, History, Settings, Wallet, ChevronRight, Sparkles, BarChart3, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfilePage() {
  const { profile, isConnected } = useUserProfile();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [proposals, setProposals] = useState<any[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);

  // Fetch user's proposals
  React.useEffect(() => {
    if (profile?.address) {
      fetchProposals();
    }
  }, [profile?.address]);

  const fetchProposals = async () => {
    if (!profile?.address) return;
    
    try {
      setLoadingProposals(true);
      const response = await fetch(`/api/proposals?address=${profile.address}`);
      if (response.ok) {
        const data = await response.json();
        setProposals(data);
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setLoadingProposals(false);
    }
  };

  // Mock data for analytics - in production, this would come from the API
  const monthlyDonations = [
    { month: 'Jan', amount: 500, amountUSD: 500 },
    { month: 'Feb', amount: 750, amountUSD: 750 },
    { month: 'Mar', amount: 600, amountUSD: 600 },
    { month: 'Apr', amount: 900, amountUSD: 900 },
    { month: 'May', amount: 1200, amountUSD: 1200 },
    { month: 'Jun', amount: 800, amountUSD: 800 },
  ];

  const categoryBreakdown = [
    { category: 'Healthcare', amount: 2500, percentage: 35 },
    { category: 'Education', amount: 1800, percentage: 25 },
    { category: 'Environment', amount: 1200, percentage: 17 },
    { category: 'Community', amount: 900, percentage: 13 },
    { category: 'Emergency', amount: 700, percentage: 10 },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 flex-grow">
        {/* Header Section with Animation */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-[#0a2233] to-[#18344a] rounded-3xl p-10 mb-8 text-white overflow-hidden relative"
        >
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(78, 205, 196, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(185, 131, 255, 0.3) 0%, transparent 50%)' }}></div>
          </div>
          
          <div className="relative flex items-center justify-between">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3 mb-3"
              >
                <Sparkles className="h-8 w-8 text-cyan-400" />
                <h1 className="text-5xl font-bold tracking-tight">Welcome back, {profile?.displayName || 'User'}</h1>
              </motion.div>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-300 text-lg"
              >
                Track your impact and manage your SuiGive profile
              </motion.p>
            </div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="hidden lg:flex items-center gap-6"
            >
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 hover:bg-white/15 transition-colors">
                <p className="text-sm text-gray-300 mb-2">Total Impact</p>
                <p className="text-3xl font-bold">${profile?.totalDonated ? (Number(profile.totalDonated) / 1_000_000).toFixed(2) : '0.00'}</p>
                <p className="text-xs text-gray-400 mt-1">sgUSD donated</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 hover:bg-white/15 transition-colors">
                <p className="text-sm text-gray-300 mb-2">Campaigns</p>
                <p className="text-3xl font-bold">{profile?.donationCount || 0}</p>
                <p className="text-xs text-gray-400 mt-1">supported</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Navigation Sidebar + Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-3"
          >
            <ModernCard className="sticky top-4">
              <ModernCardContent className="p-6">
                <nav className="space-y-2">
                  <motion.button
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                      activeSection === 'dashboard' 
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' 
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                    onClick={() => setActiveSection('dashboard')}
                  >
                    <div className="flex items-center gap-3">
                      <LayoutDashboard className="h-5 w-5" />
                      <span className="font-medium">Dashboard</span>
                    </div>
                    <ChevronRight className={`h-4 w-4 transition-opacity ${
                      activeSection === 'dashboard' ? 'opacity-100' : 'opacity-0'
                    }`} />
                  </motion.button>
                  <motion.button
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                      activeSection === 'profile' 
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' 
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                    onClick={() => setActiveSection('profile')}
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="h-5 w-5" />
                      <span className="font-medium">Profile Settings</span>
                    </div>
                    <ChevronRight className={`h-4 w-4 transition-opacity ${
                      activeSection === 'profile' ? 'opacity-100' : 'opacity-0'
                    }`} />
                  </motion.button>
                  <motion.button
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                      activeSection === 'receipts' 
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' 
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                    onClick={() => setActiveSection('receipts')}
                  >
                    <div className="flex items-center gap-3">
                      <Receipt className="h-5 w-5" />
                      <span className="font-medium">NFT Receipts</span>
                    </div>
                    <ChevronRight className={`h-4 w-4 transition-opacity ${
                      activeSection === 'receipts' ? 'opacity-100' : 'opacity-0'
                    }`} />
                  </motion.button>
                  <motion.button
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                      activeSection === 'history' 
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' 
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                    onClick={() => setActiveSection('history')}
                  >
                    <div className="flex items-center gap-3">
                      <History className="h-5 w-5" />
                      <span className="font-medium">Donation History</span>
                    </div>
                    <ChevronRight className={`h-4 w-4 transition-opacity ${
                      activeSection === 'history' ? 'opacity-100' : 'opacity-0'
                    }`} />
                  </motion.button>
                  <motion.button
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                      activeSection === 'achievements' 
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' 
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                    onClick={() => setActiveSection('achievements')}
                  >
                    <div className="flex items-center gap-3">
                      <Trophy className="h-5 w-5" />
                      <span className="font-medium">Achievements</span>
                    </div>
                    <ChevronRight className={`h-4 w-4 transition-opacity ${
                      activeSection === 'achievements' ? 'opacity-100' : 'opacity-0'
                    }`} />
                  </motion.button>
                  <motion.button
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                      activeSection === 'proposals' 
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' 
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                    onClick={() => setActiveSection('proposals')}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5" />
                      <span className="font-medium">My Proposals</span>
                    </div>
                    <ChevronRight className={`h-4 w-4 transition-opacity ${
                      activeSection === 'proposals' ? 'opacity-100' : 'opacity-0'
                    }`} />
                  </motion.button>
                </nav>

                {/* Quick Stats */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="mt-8 pt-8 border-t border-gray-100"
                >
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Quick Stats
                  </h3>
                  <div className="space-y-3">
                    <motion.div 
                      whileHover={{ x: 2 }}
                      className="flex justify-between items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-sm text-gray-600">Total Donated</span>
                      <span className="font-semibold text-gray-900">${profile?.totalDonated ? (Number(profile.totalDonated) / 1_000_000).toFixed(2) : '0.00'}</span>
                    </motion.div>
                    <motion.div 
                      whileHover={{ x: 2 }}
                      className="flex justify-between items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-sm text-gray-600">Campaigns</span>
                      <span className="font-semibold text-gray-900">{profile?.donationCount || 0}</span>
                    </motion.div>
                    <motion.div 
                      whileHover={{ x: 2 }}
                      className="flex justify-between items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-sm text-gray-600">NFT Receipts</span>
                      <span className="font-semibold text-gray-900">{profile?.donationCount || 0}</span>
                    </motion.div>
                  </div>
                </motion.div>
              </ModernCardContent>
            </ModernCard>
          </motion.div>

          {/* Main Content Area */}
          <div className="lg:col-span-9">
            {activeSection === 'dashboard' && (
              <ProfileAnalytics
                totalDonated={profile?.totalDonated || '0'}
                donationCount={profile?.donationCount || 0}
                totalDonatedUSD={profile?.totalDonated ? (Number(profile.totalDonated) / 1_000_000).toFixed(2) : '0.00'}
                monthlyDonations={monthlyDonations}
                categoryBreakdown={categoryBreakdown}
              />
            )}

            {activeSection === 'profile' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <ModernCard>
                  <ModernCardHeader>
                    <ModernCardTitle>Profile Settings</ModernCardTitle>
                    <p className="text-sm text-gray-500 mt-2">Manage your public profile and privacy settings</p>
                  </ModernCardHeader>
                  <ModernCardContent>
                    <UserProfile editable={true} showDonations={false} showCampaigns={false} />
                  </ModernCardContent>
                </ModernCard>
              </motion.div>
            )}

            {activeSection === 'receipts' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <ModernCard>
                  <ModernCardHeader>
                    <ModernCardTitle>NFT Donation Receipts</ModernCardTitle>
                    <p className="text-sm text-gray-500 mt-2">View and manage your soulbound NFT receipts</p>
                  </ModernCardHeader>
                  <ModernCardContent>
                    <DonationNFTGallery />
                  </ModernCardContent>
                </ModernCard>
              </motion.div>
            )}

            {activeSection === 'history' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <ModernCard>
                  <ModernCardHeader>
                    <ModernCardTitle>Donation History</ModernCardTitle>
                    <p className="text-sm text-gray-500 mt-2">Complete record of all your donations</p>
                  </ModernCardHeader>
                  <ModernCardContent>
                    <DonationHistory />
                  </ModernCardContent>
                </ModernCard>
              </motion.div>
            )}

            {activeSection === 'proposals' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <ModernCard>
                  <ModernCardHeader>
                    <ModernCardTitle>Campaign Proposals</ModernCardTitle>
                    <p className="text-sm text-gray-500 mt-2">Track the status of your campaign proposals</p>
                  </ModernCardHeader>
                  <ModernCardContent>
                    {loadingProposals ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Loading proposals...</p>
                      </div>
                    ) : proposals.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">No proposals yet</p>
                        <Button 
                          onClick={() => window.location.href = '/submit-proposal'}
                          className="bg-sui-navy hover:bg-sui-navy/90"
                        >
                          Submit Your First Proposal
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {proposals.map((proposal) => (
                          <motion.div
                            key={proposal.id}
                            whileHover={{ scale: 1.01 }}
                            className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-lg">{proposal.name}</h4>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                proposal.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                proposal.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                proposal.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {proposal.status.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-3">{proposal.description}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Goal:</span>
                                <p className="font-medium">{(Number(proposal.goalAmount) / 1_000_000_000).toFixed(2)} sgUSD</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Duration:</span>
                                <p className="font-medium">{proposal.duration} days</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Submitted:</span>
                                <p className="font-medium">{new Date(proposal.createdAt).toLocaleDateString()}</p>
                              </div>
                              {proposal.reviewedAt && (
                                <div>
                                  <span className="text-gray-500">Reviewed:</span>
                                  <p className="font-medium">{new Date(proposal.reviewedAt).toLocaleDateString()}</p>
                                </div>
                              )}
                            </div>
                            {proposal.reviewNotes && (
                              <div className="mt-3 p-3 bg-gray-50 rounded">
                                <p className="text-sm text-gray-700">
                                  <span className="font-medium">Review Notes:</span> {proposal.reviewNotes}
                                </p>
                              </div>
                            )}
                            {proposal.status === 'APPROVED' && proposal.campaign && (
                              <div className="mt-3">
                                <Button 
                                  onClick={() => window.location.href = `/donate/${proposal.campaignId}`}
                                  className="bg-green-600 hover:bg-green-700"
                                  size="sm"
                                >
                                  View Live Campaign
                                </Button>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </ModernCardContent>
                </ModernCard>
              </motion.div>
            )}

            {activeSection === 'achievements' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <ModernCard>
                  <ModernCardHeader>
                    <ModernCardTitle>Your Achievements</ModernCardTitle>
                    <p className="text-sm text-gray-500 mt-2">Milestones and badges earned through your contributions</p>
                  </ModernCardHeader>
                  <ModernCardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Achievement Cards */}
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-yellow-50 to-amber-50 p-8 rounded-2xl text-center hover:shadow-lg transition-shadow cursor-pointer"
                      >
                        <div className="bg-yellow-100 p-4 rounded-full inline-block mb-4">
                          <Trophy className="h-10 w-10 text-yellow-600" />
                        </div>
                        <h4 className="font-bold text-gray-900 text-lg">Early Supporter</h4>
                        <p className="text-sm text-gray-600 mt-2">Joined in the first month</p>
                      </motion.div>
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-blue-50 to-cyan-50 p-8 rounded-2xl text-center hover:shadow-lg transition-shadow cursor-pointer"
                      >
                        <div className="bg-blue-100 p-4 rounded-full inline-block mb-4">
                          <Wallet className="h-10 w-10 text-blue-600" />
                        </div>
                        <h4 className="font-bold text-gray-900 text-lg">Generous Donor</h4>
                        <p className="text-sm text-gray-600 mt-2">Donated over $1000 sgUSD</p>
                      </motion.div>
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 0.5, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl text-center cursor-not-allowed"
                      >
                        <div className="bg-purple-100 p-4 rounded-full inline-block mb-4 opacity-50">
                          <Trophy className="h-10 w-10 text-purple-400" />
                        </div>
                        <h4 className="font-bold text-gray-400 text-lg">Impact Maker</h4>
                        <p className="text-sm text-gray-400 mt-2">Support 10 campaigns</p>
                        <p className="text-xs text-gray-400 mt-3">🔒 Locked</p>
                      </motion.div>
                    </div>
                  </ModernCardContent>
                </ModernCard>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}