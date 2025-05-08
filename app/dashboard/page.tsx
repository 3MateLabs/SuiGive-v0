"use client"

import { useEffect, useState, Suspense } from "react"
import { Heart, BarChart2, Settings, Wallet as WalletIcon, Activity, Layers, DollarSign, Edit2, Share2, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams, useRouter } from "next/navigation"

const sidebarLinks = [
  { name: "Dashboard", icon: <BarChart2 className="w-5 h-5" /> },
  { name: "My Projects", icon: <Layers className="w-5 h-5" /> },
  { name: "Donations", icon: <DollarSign className="w-5 h-5" /> },
  { name: "Activity", icon: <Activity className="w-5 h-5" /> },
  { name: "Analytics", icon: <BarChart2 className="w-5 h-5" /> },
  { name: "Wallet", icon: <WalletIcon className="w-5 h-5" /> },
  { name: "Settings", icon: <Settings className="w-5 h-5" /> },
]

const userMock = {
  name: "Alex Chen",
  handle: "alex.sui",
  avatar: "/avatar1.jpg",
}

// Component to handle search params logic
function TabInitializer() {
  const searchParams = useSearchParams();
  const [initialTab, setInitialTab] = useState("Dashboard");
  
  useEffect(() => {
    if (searchParams) {
      const tab = searchParams.get("tab");
      if (tab) {
        const tabFormatted = tab.charAt(0).toUpperCase() + tab.slice(1).toLowerCase();
        if (["Dashboard", "My Projects", "Donations", "Activity", "Analytics", "Wallet", "Settings"].includes(tabFormatted)) {
          setInitialTab(tabFormatted);
        }
      }
    }
  }, [searchParams]);
  
  return initialTab;
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Dashboard")
  
  // Wrap the search params logic in Suspense
  useEffect(() => {
    // Initialize tab from search params
    const initializeTab = async () => {
      const initialTab = await new Promise<string>(resolve => {
        // Small timeout to ensure client-side rendering is complete
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
  const [wallet, setWallet] = useState("")
  const [projectTab, setProjectTab] = useState('Active Projects')
  const [walletDropdown, setWalletDropdown] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWallet(localStorage.getItem("suiWallet") || "0x7a9d...3f4d")
    }
  }, [])

  function shortAddress(addr: string) {
    if (!addr) return '';
    return addr.slice(0, 6) + '...' + addr.slice(-4);
  }

  function handleDisconnect() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("suiWallet");
    }
    setWallet("");
    setWalletDropdown(false);
    router.push("/");
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
    },
  ]

  const contributions = [
    {
      id: 1,
      title: "Clean Water Project",
      amount: "500",
      date: "2025-04-01",
    },
    {
      id: 2,
      title: "Healthcare Crowdfund for Alex",
      amount: "750",
      date: "2025-03-28",
    },
    {
      id: 3,
      title: "Community Garden Initiative",
      amount: "250",
      date: "2025-03-15",
    },
  ]

  return (
    <div className="min-h-screen flex bg-[#f6fbfa]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0a2233] text-white flex flex-col justify-between min-h-screen">
        <div>
          <Link href="/" className="block px-6 py-6 text-2xl font-bold hover:opacity-80 transition-opacity">SuiGives</Link>
          <nav className="mt-4">
            {sidebarLinks.map(link => (
              <div
                key={link.name}
                className={`flex items-center px-6 py-3 cursor-pointer hover:bg-[#18344a] rounded-lg mb-1 ${activeTab === link.name ? "bg-[#18344a]" : ""}`}
                onClick={() => setActiveTab(link.name)}
              >
                <span className="mr-3">{link.icon}</span>
                <span className="font-medium">{link.name}</span>
              </div>
            ))}
          </nav>
        </div>
        <div className="px-6 py-4 border-t border-[#18344a] flex items-center gap-3">
          <img src={userMock.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
          <div>
            <div className="font-semibold">{userMock.name}</div>
            <div className="text-xs text-gray-300">{userMock.handle}</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-2xl font-bold text-[#0a2233]">{activeTab}</div>
          <div className="flex items-center gap-4">
            <input type="text" placeholder="Search..." className="px-4 py-2 rounded bg-[#f1f5f9] border border-gray-200 text-sm" />
            <button className="relative">
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V4a2 2 0 1 0-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" stroke="#0a2233" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            {/* Wallet status button */}
            <div className="relative">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded bg-[#1a2a3a] text-white font-mono text-sm hover:bg-[#22334a] border border-[#22334a] focus:outline-none"
                onClick={() => setWalletDropdown((open) => !open)}
              >
                <span className="w-5 h-5 rounded-full bg-[#2d3a4d] flex items-center justify-center">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#fff"/><path d="M7 12h10M7 16h10M7 8h10" stroke="#0a2233" strokeWidth="2" strokeLinecap="round"/></svg>
                </span>
                <span>{shortAddress(wallet)}</span>
                <svg width="12" height="12" fill="none" viewBox="0 0 20 20"><path d="M7 8l3 3 3-3" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
              {walletDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-[#1a2a3a] text-white rounded shadow-lg z-50 p-4 border border-[#22334a]">
                  <div className="mb-2 text-xs text-gray-400">Connected</div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono bg-[#22334a] px-2 py-1 rounded text-xs flex items-center gap-1 max-w-[140px] overflow-hidden">
                      {shortAddress(wallet)}
                      <button
                        className="text-gray-400 hover:text-white"
                        onClick={() => navigator.clipboard.writeText(wallet)}
                        title="Copy address"
                      >
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/><rect x="3" y="3" width="13" height="13" rx="2" fill="#fff" stroke="currentColor" strokeWidth="2"/></svg>
                      </button>
                      <a
                        href={`https://explorer.sui.io/address/${wallet}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white"
                        title="View on Explorer"
                      >
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 3h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </a>
                    </span>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="w-full mt-2 px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600 text-sm font-medium transition"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Section Content */}
        {activeTab === 'Dashboard' && (
          <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center justify-center mb-8">
            <div className="text-2xl font-bold text-[#0a2233] mb-2">Welcome to your Dashboard</div>
            <div className="text-gray-500 text-base mb-4">Track your crowdfunding activity, manage your projects, and view your wallet all in one place.</div>
            <div className="w-full h-64 bg-gray-100 rounded flex items-center justify-center">
              <span className="text-gray-400">[Dashboard Overview Chart Placeholder]</span>
            </div>
          </div>
        )}
        {activeTab === 'My Projects' && (
          <div>
            <div className="flex gap-2 mb-6">
              {['Active Projects', 'Drafts', 'Completed'].map(tab => (
                <button
                  key={tab}
                  className={`px-5 py-2 rounded-full font-medium text-sm ${projectTab === tab ? 'bg-[#e6f2fa] text-[#0a2233]' : 'bg-white text-gray-500 border border-gray-200'}`}
                  onClick={() => setProjectTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            {projectTab === 'Active Projects' && (
              <div className="bg-white rounded-xl p-8 mb-8 shadow-sm border">
                <h2 className="text-2xl font-bold mb-1 text-[#0a2233]">Start a New Project</h2>
                <p className="text-gray-500 mb-6">Fill out the form below to create a new crowdfunding project</p>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-semibold mb-1">Project Title</label>
                      <input type="text" placeholder="Enter a catchy title for your project" className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-100" />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Category</label>
                      <select className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-100">
                        <option>Select a category</option>
                        <option>Community</option>
                        <option>Education</option>
                        <option>Healthcare</option>
                        <option>Technology</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Project Description</label>
                    <textarea placeholder="Describe your project and why people should support it" className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-100 min-h-[100px]" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-semibold mb-1">Funding Goal (USD)</label>
                      <input type="number" placeholder="Enter amount" className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-100" />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Duration</label>
                      <select className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-100">
                        <option>Select duration</option>
                        <option>7 days</option>
                        <option>14 days</option>
                        <option>30 days</option>
                        <option>60 days</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Project Image</label>
                    <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-gray-400">
                      <svg width="40" height="40" fill="none" viewBox="0 0 24 24"><path d="M12 16v-4m0 0V8m0 4h4m-4 0H8" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="3" width="18" height="18" rx="2" stroke="#cbd5e1" strokeWidth="2"/></svg>
                      <span className="mt-2">Drag and drop your image here, or click to browse</span>
                      <button type="button" className="mt-2 px-4 py-2 bg-gray-100 rounded font-medium text-[#0a2233] border border-gray-200">Browse Files</button>
                    </div>
                  </div>
                  <div className="flex justify-between mt-6">
                    <button type="button" className="px-6 py-2 rounded bg-white border border-gray-300 text-[#0a2233] font-medium hover:bg-gray-50">Save as Draft</button>
                    <button type="submit" className="px-6 py-2 rounded bg-[#0a2233] text-white font-medium hover:bg-[#18344a]">Create Project</button>
                  </div>
                </form>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myProjects.filter(p => projectTab === 'Active Projects').map((project) => (
                <div key={project.id} className="bg-white rounded-xl overflow-hidden border shadow-sm flex flex-col">
                  <div className="flex flex-col md:flex-row">
                    <div className="relative w-full md:w-48 h-40 md:h-auto">
                      <Image
                        src={project.image || "/placeholder.svg"}
                        alt={project.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>
                        </div>
                        <h3 className="text-lg font-bold mb-1 text-[#0a2233]">{project.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                          <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> 427 donors</span>
                          <span className="flex items-center gap-1"><span className="bg-gray-100 text-[#0a2233] px-2 py-1 rounded font-mono">Technology</span></span>
                          <span>Created: Apr 10, 2025</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex-1">
                          <div className="w-full h-2 bg-gray-200 rounded-full mb-1">
                            <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${project.progress}%` }}></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{project.progress}% funded</span>
                            <span>Goal: ${project.goal}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>{project.daysLeft} days left</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button className="flex items-center gap-1 px-3 py-1 rounded bg-[#f1f5f9] text-[#0a2233] border border-gray-200 hover:bg-gray-100 text-xs"><svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V4a2 2 0 1 0-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" stroke="#0a2233" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> View Details</button>
                        <button className="flex items-center gap-1 px-3 py-1 rounded bg-[#f1f5f9] text-[#0a2233] border border-gray-200 hover:bg-gray-100 text-xs"><Edit2 className="w-4 h-4" /> Edit Project</button>
                        <button className="flex items-center gap-1 px-3 py-1 rounded bg-[#f1f5f9] text-[#0a2233] border border-gray-200 hover:bg-gray-100 text-xs"><Share2 className="w-4 h-4" /> Share</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'Donations' && (
          <div className="bg-white rounded-xl overflow-hidden border shadow-sm">
            <div className="p-6">
              <h3 className="text-xl font-everett font-bold mb-4 sui-navy-text">Your Contributions</h3>
              <div className="space-y-4">
                {contributions.map((contribution) => (
                  <div key={contribution.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium font-everett">{contribution.title}</h4>
                      <p className="text-sm text-gray-600 font-inter">
                        {new Date(contribution.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold font-everett">{contribution.amount} SUI</div>
                      <Link href="#" className="text-sm text-sui-navy hover:underline font-inter">
                        View Project
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'Activity' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="font-bold text-lg mb-1">Recent Activity</div>
            <div className="text-gray-500 text-sm mb-4">What's happening in your community</div>
            <div className="w-full h-64 bg-gray-100 rounded flex items-center justify-center">
              <span className="text-gray-400">[Activity Feed Placeholder]</span>
            </div>
          </div>
        )}
        {activeTab === 'Analytics' && (
          <div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="font-bold text-lg mb-1">Analytics</div>
              <div className="text-gray-500 text-sm mb-4">View your crowdfunding analytics and insights here.</div>
              <div className="w-full h-64 bg-gray-100 rounded flex items-center justify-center">
                <span className="text-gray-400">[Analytics Chart Placeholder]</span>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'Wallet' && (
          <div>
            <div className="bg-gradient-to-r from-[#0a2233] to-[#18344a] rounded-xl p-8 text-white mb-8">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="text-lg font-bold">Connected Wallet</div>
                  <div className="text-sm text-gray-200">Slush Wallet</div>
                  <div className="mt-2 bg-[#112a3c] px-3 py-2 rounded font-mono text-xs block">{wallet || 'Not connected'}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">SUI Balance</div>
                  {/* TODO: Replace the placeholder below with real balance from Sui blockchain or wallet provider */}
                  <div className="text-2xl">245.78 SUI</div>
                  <div className="text-xs text-gray-200">≈ $1,228.90 USD</div>
                </div>
              </div>
              <div className="flex gap-4 mt-4">
                <button className="bg-white text-[#0a2233] px-4 py-2 rounded font-semibold">Send Funds</button>
                <button className="bg-white text-[#0a2233] px-4 py-2 rounded font-semibold">Receive Funds</button>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
              <div className="font-bold text-lg mb-4">Connected Wallets</div>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded">
                  <div>
                    <div className="font-semibold">Slush Wallet <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Primary</span></div>
                    <div className="font-mono text-xs text-gray-500">{wallet || 'Not connected'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">245.78 SUI</div>
                    <div className="text-xs text-gray-500">$1,228.90 USD</div>
                  </div>
                </div>
                {/* To fetch the real SUI balance, use the Sui blockchain API or your wallet provider here. */}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'Settings' && (
          <div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="font-bold text-lg mb-1">Settings</div>
              <div className="text-gray-500 text-sm mb-4">Manage your account settings and preferences here.</div>
              <div className="w-full h-64 bg-gray-100 rounded flex items-center justify-center">
                <span className="text-gray-400">[Settings Placeholder]</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
