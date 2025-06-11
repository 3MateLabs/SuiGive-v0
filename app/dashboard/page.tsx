"use client"

import { useEffect, useState } from "react"
import { Heart, BarChart2, Settings, Wallet as WalletIcon, Activity, Layers, DollarSign, Edit2, Share2, CheckCircle, Clock, TrendingUp, Users, Target, Calendar, Plus, Upload, ArrowRight, Sparkles, X, Search, Bell, MoreVertical, ExternalLink, Copy, Rocket, ChevronDown } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams, useRouter } from "next/navigation"
import DonationNFTGallery from "@/components/DonationNFTGallery"
import { UserProfile } from "@/components/UserProfile"
import { useCurrentAccount } from '@mysten/dapp-kit'
import { WalletConnectButton } from "@/components/WalletConnectButton"
import { motion, AnimatePresence } from 'framer-motion'
import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent, StatCard } from "@/components/ui/modern-card"

const sidebarLinks = [
  { name: "Dashboard", icon: <BarChart2 className="w-5 h-5" /> },
  { name: "My Projects", icon: <Layers className="w-5 h-5" /> },
  { name: "Donations", icon: <DollarSign className="w-5 h-5" /> },
  { name: "Activity", icon: <Activity className="w-5 h-5" /> },
  { name: "Analytics", icon: <BarChart2 className="w-5 h-5" /> },
  { name: "Wallet", icon: <WalletIcon className="w-5 h-5" /> },
  { name: "Settings", icon: <Settings className="w-5 h-5" /> },
]

export default function DashboardPage() {
  const router = useRouter();
  const currentAccount = useCurrentAccount();
  const [activeTab, setActiveTab] = useState("Dashboard")
  const [projectTab, setProjectTab] = useState('Active Projects')
  const [walletDropdown, setWalletDropdown] = useState(false)
  const [showNewProjectForm, setShowNewProjectForm] = useState(false)
  const [notifications, setNotifications] = useState(3)
  const [searchQuery, setSearchQuery] = useState("")

  // Initialize tab from search params
  useEffect(() => {
    const initializeTab = async () => {
      const initialTab = await new Promise<string>(resolve => {
        setTimeout(() => {
          try {
            const params = new URLSearchParams(window.location.search);
            const tab = params.get("tab");
            if (tab) {
              const tabFormatted = tab.charAt(0).toUpperCase() + tab.slice(1).toLowerCase();
              if (["Dashboard", "My Projects", "Donations", "Activity", "Analytics", "Wallet", "Settings"].includes(tabFormatted)) {
                resolve(tabFormatted);
                return;
              }
            }
            resolve("Dashboard");
          } catch (e) {
            resolve("Dashboard");
          }
        }, 0);
      });
      setActiveTab(initialTab);
    };
    
    initializeTab();
  }, []);

  function shortAddress(addr: string) {
    if (!addr) return '';
    return addr.slice(0, 6) + '...' + addr.slice(-4);
  }

  // If no wallet connected, show connection prompt
  if (!currentAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl p-12 shadow-2xl text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-gradient-to-br from-[#0a2233] to-[#18344a] rounded-full flex items-center justify-center mx-auto mb-8"
          >
            <WalletIcon className="w-12 h-12 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-[#0a2233] mb-4">Connect Your Wallet</h1>
          <p className="text-gray-600 mb-8 text-lg">Please connect your wallet to access your personalized dashboard</p>
          <WalletConnectButton />
        </motion.div>
      </div>
    );
  }

  const myProjects = [
    {
      id: 1,
      title: "Healthcare Initiative",
      description: "Funding for medical supplies in underserved communities",
      progress: 75,
      raised: "15,000",
      goal: "20,000",
      daysLeft: 12,
      image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
      status: "active",
      category: "Healthcare",
      donors: 427,
      createdAt: "Apr 10, 2025"
    },
    {
      id: 2,
      title: "Education Program",
      description: "Supporting educational resources for rural schools",
      progress: 40,
      raised: "8,000",
      goal: "20,000",
      daysLeft: 25,
      image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80",
      status: "active",
      category: "Education",
      donors: 189,
      createdAt: "Apr 8, 2025"
    },
  ]

  const contributions = [
    {
      id: 1,
      title: "Clean Water Project",
      amount: "500",
      date: "2025-04-01",
      status: "completed"
    },
    {
      id: 2,
      title: "Healthcare Crowdfund for Alex",
      amount: "750",
      date: "2025-03-28",
      status: "completed"
    },
    {
      id: 3,
      title: "Community Garden Initiative",
      amount: "250",
      date: "2025-03-15",
      status: "completed"
    },
  ]

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Modern Sidebar */}
      <motion.aside 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between min-h-screen"
      >
        <div>
          <Link href="/" className="flex items-center gap-3 px-6 py-6 hover:opacity-80 transition-opacity">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <img src="/images/TheLogo.png" alt="SuiGives Logo" className="h-12 w-12" />
              <div className="absolute inset-0 bg-[#4ECDC4] blur-xl opacity-50"></div>
            </motion.div>
            <span className="text-xl font-semibold text-[#0a2233]">SuiGives</span>
          </Link>
          
          <nav className="mt-6 px-4">
            {sidebarLinks.map((link, index) => (
              <motion.div
                key={link.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative mb-2 group"
                onClick={() => setActiveTab(link.name)}
              >
                <div className={`flex items-center px-4 py-3 cursor-pointer rounded-lg transition-all duration-300 ${
                  activeTab === link.name 
                    ? "bg-[#1e3a4c] text-white" 
                    : "hover:bg-gray-50 text-gray-600"
                }`}>
                  <span className={`mr-3 ${activeTab === link.name ? 'text-white' : 'text-gray-500'}`}>{link.icon}</span>
                  <span className="text-sm font-medium">{link.name}</span>
                  {link.name === "Activity" && notifications > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium shadow-lg">
                      <span className="leading-none">{notifications}</span>
                    </span>
                  )}
                </div>
                {activeTab === link.name && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 bg-[#0a2233]/5 rounded-2xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.div>
            ))}
          </nav>
        </div>
        
        <div className="p-4">
          <UserProfile compact={true} editable={false} showDonations={false} showCampaigns={false} />
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-40 bg-white border-b border-gray-200"
        >
          <div className="flex items-center justify-between px-8 py-6">
            <div>
              <h1 className="text-3xl font-bold text-[#0a2233]">
                {activeTab}
              </h1>
              <p className="text-gray-500 mt-1 text-lg">
                {activeTab === 'Dashboard' && 'Track your impact and manage campaigns'}
                {activeTab === 'My Projects' && 'Create and manage your crowdfunding projects'}
                {activeTab === 'Donations' && 'View your contribution history'}
                {activeTab === 'Activity' && 'Stay updated with recent activities'}
                {activeTab === 'Analytics' && 'Analyze your campaign performance'}
                {activeTab === 'Wallet' && 'Manage your crypto assets'}
                {activeTab === 'Settings' && 'Customize your experience'}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Modern Search Bar */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="relative group"
              >
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search campaigns..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-2.5 w-80 rounded-lg bg-gray-50 border border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4ECDC4] focus:bg-white transition-all duration-300" 
                />
              </motion.div>
              
              {/* Notification Bell */}
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 rounded-lg hover:bg-gray-50 transition-all duration-300"
              >
                <Bell className="h-6 w-6 text-gray-600" />
                {notifications > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF6B6B] rounded-full flex items-center justify-center shadow-lg"
                  >
                    <span className="text-xs text-white font-bold leading-none">{notifications}</span>
                  </motion.span>
                )}
              </motion.button>
              
              {/* Modern Wallet Dropdown */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1e3a4c] text-white hover:bg-[#2a4a5c] transition-all duration-300"
                  onClick={() => setWalletDropdown(!walletDropdown)}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4ECDC4] to-[#44A8D8] flex items-center justify-center">
                    <WalletIcon className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-medium">{shortAddress(currentAccount?.address || '')}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${walletDropdown ? 'rotate-180' : ''}`} />
                </motion.button>
                
                <AnimatePresence>
                  {walletDropdown && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl z-50 p-6 border border-gray-100"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-500">Connected Wallet</span>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Active</span>
                      </div>
                      
                      <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-sm text-gray-700">{shortAddress(currentAccount?.address || '')}</span>
                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => navigator.clipboard.writeText(currentAccount?.address || '')}
                              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                              <Copy className="h-4 w-4 text-gray-600" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => window.open(`https://explorer.sui.io/address/${currentAccount?.address}`, '_blank')}
                              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                              <ExternalLink className="h-4 w-4 text-gray-600" />
                            </motion.button>
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 mb-1">Balance</p>
                          <p className="text-2xl font-bold text-gray-900">245.78 <span className="text-sm font-normal">SUI</span></p>
                          <p className="text-sm text-gray-500">≈ $1,228.90 USD</p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <WalletConnectButton variant="minimal" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Content Area */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'Dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Welcome Banner */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative overflow-hidden bg-gradient-to-br from-[#0a2233] via-[#1e3a4c] to-[#2a4a5c] rounded-3xl p-8 text-white shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/10"></div>
                  <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#4ECDC4]/20 to-transparent rounded-full blur-3xl"></div>
                  <div className="relative z-10 max-w-3xl">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <h2 className="text-4xl font-bold mb-3 flex items-center gap-3">
                        Welcome back! 
                        <motion.span
                          animate={{ rotate: [0, 20, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          👋
                        </motion.span>
                      </h2>
                      <p className="text-lg text-gray-200 mb-6">
                        Your campaigns have raised <span className="font-bold text-white">$24,500</span> this month. Keep up the amazing work making a difference in the world!
                      </p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex gap-4"
                    >
                      <Link href="/create">
                        <motion.button 
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          className="bg-white text-[#0a2233] px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-300 flex items-center gap-2"
                        >
                          <Rocket className="h-5 w-5" />
                          Create New Campaign
                        </motion.button>
                      </Link>
                      <motion.button 
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/30 transition-all duration-300 border border-white/30"
                      >
                        View Analytics
                      </motion.button>
                    </motion.div>
                  </div>
                </motion.div>
                
                {/* Modern Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                    { title: "Total Raised", value: "$24,500", subtitle: "sgUSD", icon: <TrendingUp className="h-5 w-5" />, trend: { value: 12, isPositive: true }, color: "blue" },
                    { title: "Total Backers", value: "1,247", subtitle: "Supporters", icon: <Users className="h-5 w-5" />, trend: { value: 8, isPositive: true }, color: "blue" },
                    { title: "Active Campaigns", value: "5", subtitle: "2 ending soon", icon: <Target className="h-5 w-5" />, color: "blue" },
                    { title: "Success Rate", value: "85%", subtitle: "12 days avg", icon: <Calendar className="h-5 w-5" />, color: "blue" }
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <StatCard {...stat} />
                    </motion.div>
                  ))}
                </div>
                
                {/* Recent Activity */}
                <ModernCard>
                  <ModernCardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Activity className="h-5 w-5 text-gray-600" />
                        <div>
                          <ModernCardTitle>Recent Activity</ModernCardTitle>
                          <p className="text-sm text-gray-500">Latest updates from your campaigns</p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        className="text-sm text-[#0a2233] hover:text-[#18344a] font-medium"
                      >
                        View All →
                      </motion.button>
                    </div>
                  </ModernCardHeader>
                  <ModernCardContent>
                    <div className="space-y-4">
                      {[
                        { action: "New donation", project: "Healthcare Initiative", amount: "$250", time: "2 hours ago", icon: <Heart className="h-4 w-4 text-gray-500" /> },
                        { action: "Campaign milestone", project: "Education Program", amount: "50% funded", time: "5 hours ago", icon: <Target className="h-4 w-4" /> },
                        { action: "New backer", project: "Healthcare Initiative", amount: "$100", time: "1 day ago", icon: <Users className="h-4 w-4" /> }
                      ].map((activity, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index }}
                          className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl hover:from-gray-100 hover:to-gray-50 transition-all duration-300 cursor-pointer border border-gray-100 hover:border-gray-200 hover:shadow-md"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-xl text-gray-600 shadow-sm border border-gray-100">
                              {activity.icon}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{activity.action}</p>
                              <p className="text-sm text-gray-500">{activity.project}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{activity.amount}</p>
                            <p className="text-xs text-gray-500">{activity.time}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ModernCardContent>
                </ModernCard>
              </motion.div>
            )}
            
            {activeTab === 'My Projects' && (
              <motion.div
                key="projects"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">My Projects</h2>
                  <p className="text-gray-600">Project management features coming soon!</p>
                </div>
              </motion.div>
            )}
            
            {activeTab === 'Donations' && (
              <motion.div
                key="donations"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Donation Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard
                    title="Total Donated"
                    value="$1,500"
                    subtitle="sgUSD"
                    icon={<DollarSign className="h-5 w-5" />}
                    color="blue"
                  />
                  <StatCard
                    title="Projects Supported"
                    value="3"
                    subtitle="Active campaigns"
                    icon={<Heart className="h-5 w-5" />}
                    color="blue"
                  />
                  <StatCard
                    title="NFT Receipts"
                    value="3"
                    subtitle="Donation proofs"
                    icon={<Sparkles className="h-5 w-5" />}
                    color="blue"
                  />
                </div>
                
                {/* Contributions List */}
                <ModernCard>
                  <ModernCardHeader>
                    <ModernCardTitle>Your Contributions</ModernCardTitle>
                    <p className="text-sm text-gray-500 mt-2">Track all your donations and their impact</p>
                  </ModernCardHeader>
                  <ModernCardContent>
                    <div className="space-y-4">
                      {contributions.map((contribution, index) => (
                        <motion.div
                          key={contribution.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl hover:shadow-lg transition-all duration-300 cursor-pointer group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#4ECDC4] to-[#44A8D8] rounded-full flex items-center justify-center text-white font-bold">
                              ${contribution.amount.slice(0, 1)}
                            </div>
                            <div>
                              <h4 className="font-semibold text-lg text-gray-900">{contribution.title}</h4>
                              <p className="text-sm text-gray-600">
                                {new Date(contribution.date).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-2xl font-bold text-gray-900">${contribution.amount}</div>
                              <div className="text-sm text-gray-500">sgUSD</div>
                            </div>
                            <motion.div
                              whileHover={{ x: 5 }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <ArrowRight className="h-5 w-5 text-gray-400" />
                            </motion.div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ModernCardContent>
                </ModernCard>
                
                {/* NFT Gallery */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">NFT Donation Receipts</h3>
                  <p className="text-gray-600 mb-6">Each donation generates a unique NFT receipt on the Sui blockchain</p>
                  <DonationNFTGallery />
                </div>
              </motion.div>
            )}
            
            {/* Other tabs placeholder */}
            {['Activity', 'Analytics', 'Wallet', 'Settings'].includes(activeTab) && (
              <motion.div
                key={activeTab.toLowerCase()}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center p-8"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{activeTab}</h2>
                <p className="text-gray-600">{activeTab} features coming soon!</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}