"use client"

import React, { useMemo, useEffect, useState } from 'react';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Campaign } from '@/lib/sui-campaigns';
import { motion } from 'framer-motion';

// Register the required Chart.js components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement
);

interface DashboardChartsProps {
  campaigns: Campaign[];
}

export default function DashboardCharts({ campaigns }: DashboardChartsProps) {
  // Calculate aggregate statistics
  const stats = useMemo(() => {
    // Initialize counters
    let totalRaisedSgUSD = 0;
    let totalBackers = 0;
    const categoryCounts: Record<string, number> = {};
    const categoryFunding: Record<string, number> = {};
    
    // Process each campaign
    campaigns.forEach(campaign => {
      // Add to total raised amounts
      // Get sgUSD amount from campaign data
      const sgUSDAmount = campaign.currentAmountSgUSD || campaign.raisedSgUSD || '0';
      
      // Parse the string value to a number
      let parsedSgUSDAmount = parseFloat(sgUSDAmount);
      
      // Handle division by 10^9 only if the value is large (indicating it's in smallest units)
      // This ensures we don't divide values that are already in the correct format
      if (parsedSgUSDAmount > 1_000_000) {
        parsedSgUSDAmount = parsedSgUSDAmount / 1_000_000_000;
      }
      
      // Add to total
      totalRaisedSgUSD += parsedSgUSDAmount;
      
      // Add to backer count
      const backerCount = typeof campaign.backerCount === 'string' 
        ? parseInt(campaign.backerCount) || 0 
        : campaign.backerCount || 0;
      totalBackers += backerCount;
      
      // Add to category counts
      const category = campaign.category || 'Uncategorized';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      
      // Add to category funding - using only sgUSD
      categoryFunding[category] = (categoryFunding[category] || 0) + parsedSgUSDAmount;
    });
    
    // Log the total for debugging
    console.log('Total raised sgUSD:', totalRaisedSgUSD);
    
    return {
      totalRaisedSgUSD,
      totalBackers,
      categoryCounts,
      categoryFunding,
      campaignCount: campaigns.length
    };
  }, [campaigns]);
  
  // Data for token distribution doughnut chart
  const tokenDistributionData = {
    labels: ['sgUSD Raised', 'sgUSD Goal Remaining'],
    datasets: [
      {
        label: 'sgUSD Distribution',
        data: [stats.totalRaisedSgUSD, Math.max(0, stats.totalRaisedSgUSD * 0.5)], // Using a placeholder for remaining goal
        backgroundColor: [
          'rgba(16, 185, 129, 0.85)', // Green for sgUSD raised
          'rgba(229, 231, 235, 0.6)', // Light gray for remaining
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(229, 231, 235, 0.8)',
        ],
        borderWidth: 0,
        hoverOffset: 4,
        borderRadius: 3,
      },
    ],
  };
  
  // Data for category distribution bar chart
  const categoryData = {
    labels: Object.keys(stats.categoryCounts),
    datasets: [
      {
        label: 'Number of Campaigns',
        data: Object.values(stats.categoryCounts),
        backgroundColor: 'rgba(0, 99, 220, 0.75)',
        borderColor: 'rgba(0, 99, 220, 1)',
        borderWidth: 0,
        borderRadius: 6,
      },
      {
        label: 'Total Funding',
        data: Object.keys(stats.categoryCounts).map(category => stats.categoryFunding[category] || 0),
        backgroundColor: 'rgba(16, 185, 129, 0.75)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 0,
        borderRadius: 6,
        yAxisID: 'y1',
      },
    ],
  };
  
  // Options for the doughnut chart
  const doughnutOptions = {
    cutout: '70%',
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            family: "'Inter', sans-serif",
            size: 12
          },
          color: '#4B5563'
        }
      },
      title: {
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value.toFixed(2)} sgUSD (${percentage}%)`;
          }
        }
      }
    },
  };
  
  const barOptions = {
    responsive: true,
    maintainAspectRatio: true,
    indexAxis: 'y' as const,
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          font: {
            family: "'Inter', sans-serif",
            size: 11
          },
          color: '#6B7280'
        }
      },
      y: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          font: {
            family: "'Inter', sans-serif",
            size: 11
          },
          color: '#6B7280'
        }
      },
      y1: {
        beginAtZero: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Total Funding'
        }
      },
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Campaigns by Category',
        font: {
          size: 16,
        },
      },
    },
  };
  
  // Animation state for chart visibility
  const [isVisible, setIsVisible] = useState(false);
  
  // Set charts to visible after component mounts for animation
  useEffect(() => {
    setIsVisible(true);
  }, []);
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border-t border-t-blue-100">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">Platform Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <motion.div 
          initial={{ y: 10, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white p-4 rounded-lg text-center border border-gray-100"
        >
          <h3 className="text-sm font-medium mb-1 text-gray-500">Total Campaigns</h3>
          <p className="text-3xl font-semibold text-gray-800">{stats.campaignCount}</p>
        </motion.div>
        <motion.div 
          initial={{ y: 10, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white p-4 rounded-lg text-center border border-gray-100"
        >
          <h3 className="text-sm font-medium mb-1 text-gray-500">Total Raised</h3>
          <p className="text-3xl font-semibold text-gray-800">
            {stats.totalRaisedSgUSD.toFixed(2)} <span className="text-sm text-gray-500">sgUSD</span>
          </p>
        </motion.div>
        <motion.div 
          initial={{ y: 10, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white p-4 rounded-lg text-center border border-gray-100"
        >
          <h3 className="text-sm font-medium mb-1 text-gray-500">Total Backers</h3>
          <p className="text-3xl font-semibold text-gray-800">{stats.totalBackers}</p>
        </motion.div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <motion.div 
          initial={{ x: -10, opacity: 0 }} 
          animate={{ x: 0, opacity: isVisible ? 1 : 0 }} 
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-lg"
        >
          <h3 className="text-sm font-medium mb-4 text-gray-500">Token Distribution</h3>
          <div className="aspect-square w-full max-w-[220px] mx-auto">
            <Doughnut data={tokenDistributionData} options={doughnutOptions} />
          </div>
          <div className="mt-4 text-center text-sm">
            <div className="flex justify-center gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-[rgba(16,185,129,0.85)]"></div>
                <span>sgUSD Raised: {stats.totalRaisedSgUSD.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-[rgba(229,231,235,0.6)]"></div>
                <span>Goal Remaining: {(stats.totalRaisedSgUSD * 0.5).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </motion.div>
        <motion.div 
          initial={{ x: 10, opacity: 0 }} 
          animate={{ x: 0, opacity: isVisible ? 1 : 0 }} 
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white rounded-lg"
        >
          <h3 className="text-sm font-medium mb-4 text-gray-500">Campaigns by Category</h3>
          <Bar data={categoryData} options={barOptions} />
          <div className="mt-4 text-center text-xs text-gray-500">
            <p>Most popular: <span className="font-medium">{Object.entries(stats.categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None'}</span></p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
