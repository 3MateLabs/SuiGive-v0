"use client"

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

// Dynamically import chart.js and react-chartjs-2 to avoid SSR issues
const DynamicDoughnut = dynamic(() => import('react-chartjs-2').then(mod => mod.Doughnut), {
  ssr: false,
});

const DynamicBar = dynamic(() => import('react-chartjs-2').then(mod => mod.Bar), {
  ssr: false,
});

// Create a component that will register Chart.js components
const ChartJSRegister = () => {
  useEffect(() => {
    // Import and register Chart.js components only on the client side
    import('chart.js').then(({ Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title }) => {
      Chart.register(
        ArcElement,
        Tooltip,
        Legend,
        CategoryScale,
        LinearScale,
        BarElement,
        Title
      );
    });
  }, []);
  
  return null;
};

interface CampaignChartsProps {
  name: string;
  goalAmount: string;
  raisedSUI: string;
  raisedSgUSD: string;
  backerCount: number;
}

export default function CampaignCharts({ 
  name, 
  goalAmount, 
  raisedSUI, 
  raisedSgUSD,
  backerCount
}: CampaignChartsProps) {
  // Register Chart.js components
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  // Convert string amounts to numbers for chart data and fix formatting
  // Divide by 10^9 to convert from Sui's smallest unit to whole units
  const raisedSgUSDValue = parseFloat(raisedSgUSD) / 1_000_000_000;
  const goalAmountValue = parseFloat(goalAmount) / 1_000_000_000;
  
  // Calculate remaining amount needed to reach goal
  const remainingToGoal = Math.max(0, goalAmountValue - raisedSgUSDValue);
  
  // Calculate the percentage of the goal reached
  const percentageComplete = goalAmountValue > 0 
    ? Math.min(100, Math.round((raisedSgUSDValue / goalAmountValue) * 100)) 
    : 0;
  
  // Data for sgUSD donation breakdown chart
  const donationBreakdownData = {
    labels: ['sgUSD Raised', 'Remaining Goal'],
    datasets: [
      {
        label: 'sgUSD Funding',
        data: [raisedSgUSDValue, remainingToGoal],
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
  
  // Data for funding progress bar chart - sgUSD only
  const fundingProgressData = {
    labels: ['sgUSD Funding Progress'],
    datasets: [
      {
        label: 'sgUSD Raised',
        data: [raisedSgUSDValue],
        backgroundColor: 'rgba(16, 185, 129, 0.85)', // Green
        borderRadius: 6,
        barThickness: 20,
      },
      {
        label: 'Goal',
        data: [goalAmountValue],
        backgroundColor: 'rgba(229, 231, 235, 0.6)', // Light gray
        borderRadius: 6,
        barThickness: 20,
      },
    ],
  };
  
  // Options for the doughnut chart
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '70%',
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
          color: '#6B7280'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#111827',
        bodyColor: '#4B5563',
        borderColor: 'rgba(229, 231, 235, 0.8)',
        borderWidth: 1,
        titleFont: {
          family: "'Inter', sans-serif",
          size: 13
        },
        bodyFont: {
          family: "'Inter', sans-serif",
          size: 12
        },
        padding: 12,
        cornerRadius: 8,
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
    }
  };
  
  // Options for the bar chart
  const barOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      x: {
        stacked: true,
        max: Math.max(goalAmountValue, raisedSgUSDValue),
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
        stacked: true,
        display: false,
        grid: {
          display: false,
          drawBorder: false
        }
      },
    },
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
          color: '#6B7280'
        }
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#111827',
        bodyColor: '#4B5563',
        borderColor: 'rgba(229, 231, 235, 0.8)',
        borderWidth: 1,
        titleFont: {
          family: "'Inter', sans-serif",
          size: 13
        },
        bodyFont: {
          family: "'Inter', sans-serif",
          size: 12
        },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.raw || 0;
            return `${label}: ${value.toFixed(2)} sgUSD`;
          },
          footer: function(tooltipItems: any) {
            const percentage = goalAmountValue > 0 ? Math.round((raisedSgUSDValue / goalAmountValue) * 100) : 0;
            return `Progress: ${percentage}%`;
          }
        }
      }
    }
  };

  // Animation state for chart visibility
  const [isVisible, setIsVisible] = useState(false);
  
  // Set charts to visible after component mounts for animation
  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl p-6 shadow-sm mt-6"
    >
      <h2 className="text-xl font-semibold mb-6 text-gray-800">Campaign Analytics</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg text-center border border-gray-100">
          <h3 className="text-sm font-medium mb-1 text-gray-500">Total Raised</h3>
          <p className="text-2xl font-semibold text-gray-800">{raisedSgUSDValue.toFixed(2)} <span className="text-sm text-gray-500">sgUSD</span></p>
        </div>
        <div className="bg-white p-4 rounded-lg text-center border border-gray-100">
          <h3 className="text-sm font-medium mb-1 text-gray-500">Backers</h3>
          <p className="text-2xl font-semibold text-gray-800">{backerCount}</p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <motion.div 
          initial={{ x: -10, opacity: 0 }} 
          animate={{ x: 0, opacity: isVisible ? 1 : 0 }} 
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-lg"
        >
          <h3 className="text-sm font-medium mb-4 text-gray-500">Donation Breakdown</h3>
          <div className="aspect-square w-full max-w-[220px] mx-auto">
            {isClient && <DynamicDoughnut data={donationBreakdownData} options={doughnutOptions} />}
          </div>
          <div className="mt-4 text-center text-xs text-gray-500">
            <p>Progress: <span className="font-medium">{percentageComplete}%</span> of goal</p>
            <div className="flex justify-center items-center gap-1 mt-2">
              <div className="w-3 h-3 rounded-full bg-[rgba(16,185,129,0.85)]"></div>
              <span>sgUSD: {raisedSgUSDValue.toFixed(2)}</span>
            </div>
          </div>
        </motion.div>
        <motion.div 
          initial={{ x: 10, opacity: 0 }} 
          animate={{ x: 0, opacity: isVisible ? 1 : 0 }} 
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-lg"
        >
          <h3 className="text-sm font-medium mb-4 text-gray-500">Funding Progress</h3>
          {isClient && <DynamicBar data={fundingProgressData} options={barOptions} />}
          <ChartJSRegister />
          <div className="mt-4 text-center text-sm">
            <p className="text-gray-500">
              {percentageComplete >= 100 
                ? "Goal reached! 🎉" 
                : `Need ${remainingToGoal.toFixed(2)} more to reach goal`}
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
