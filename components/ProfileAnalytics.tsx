"use client";

import React from 'react';
import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent, StatCard } from "@/components/ui/modern-card";
import { TrendingUp, TrendingDown, Activity, DollarSign, Users, Award, BarChart3, Calendar, Zap, Target, Heart, Clock } from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ProfileAnalyticsProps {
  totalDonated: string;
  donationCount: number;
  totalDonatedUSD: string;
  monthlyDonations?: Array<{ month: string; amount: number; amountUSD: number }>;
  categoryBreakdown?: Array<{ category: string; amount: number; percentage: number }>;
}

export default function ProfileAnalytics({
  totalDonated,
  donationCount,
  totalDonatedUSD,
  monthlyDonations = [],
  categoryBreakdown = []
}: ProfileAnalyticsProps) {
  // Calculate growth percentage (mock data for now)
  const growthPercentage = 12.5;
  const isPositiveGrowth = growthPercentage > 0;

  // Format amounts
  const formatAmount = (amount: string) => {
    try {
      const bigAmount = BigInt(amount);
      return (Number(bigAmount) / 1_000_000_000).toFixed(2);
    } catch {
      return '0.00';
    }
  };

  // Chart data for monthly donations
  const monthlyChartData = {
    labels: monthlyDonations.map(d => d.month),
    datasets: [
      {
        label: 'sgUSD Donated',
        data: monthlyDonations.map(d => d.amountUSD),
        borderColor: '#4ECDC4',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, 'rgba(78, 205, 196, 0.2)');
          gradient.addColorStop(1, 'rgba(78, 205, 196, 0.0)');
          return gradient;
        },
        tension: 0.4,
        fill: true,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#4ECDC4',
        pointBorderWidth: 2,
      }
    ]
  };

  // Chart data for category breakdown
  const categoryChartData = {
    labels: categoryBreakdown.map(c => c.category),
    datasets: [
      {
        data: categoryBreakdown.map(c => c.percentage),
        backgroundColor: [
          '#FF6B6B',
          '#4ECDC4',
          '#45B7D1',
          '#96CEB4',
          '#FECA57',
          '#B983FF'
        ],
        borderWidth: 0,
        hoverOffset: 15,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(10, 34, 51, 0.95)',
        padding: 16,
        cornerRadius: 12,
        titleFont: {
          size: 14,
          weight: '600',
        },
        bodyFont: {
          size: 13,
        },
        displayColors: false,
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#94A3B8',
          font: {
            size: 12,
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(148, 163, 184, 0.08)',
          drawBorder: false,
        },
        ticks: {
          color: '#94A3B8',
          font: {
            size: 12,
          },
          callback: function(value: any) {
            return '$' + value;
          }
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          color: '#475569',
          font: {
            size: 13,
            weight: '500',
          },
          usePointStyle: true,
          pointStyle: 'circle',
        }
      },
      tooltip: {
        backgroundColor: 'rgba(10, 34, 51, 0.95)',
        padding: 16,
        cornerRadius: 12,
        titleFont: {
          size: 14,
          weight: '600',
        },
        bodyFont: {
          size: 13,
        },
        displayColors: false,
      }
    }
  };

  // Recent activity items
  const recentActivities = [
    { title: "Donated to Clean Water Initiative", amount: "50 sgUSD", time: "2 days ago", icon: Heart },
    { title: "Achieved 'Generous Donor' badge", amount: null, time: "5 days ago", icon: Award },
    { title: "Donated to Education Fund", amount: "100 sgUSD", time: "1 week ago", icon: Heart },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Stats Grid with Staggered Animation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatCard
            title="Total Donated"
            value={`$${totalDonatedUSD}`}
            subtitle="sgUSD"
            icon={<DollarSign className="h-5 w-5" />}
            color="blue"
            trend={{ value: growthPercentage, isPositive: isPositiveGrowth }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StatCard
            title="Campaigns Supported"
            value={donationCount}
            subtitle="Total campaigns"
            icon={<Target className="h-5 w-5" />}
            color="green"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <StatCard
            title="Average Donation"
            value={`$${donationCount > 0 ? (parseFloat(totalDonatedUSD) / donationCount).toFixed(2) : '0.00'}`}
            subtitle="Per campaign"
            icon={<BarChart3 className="h-5 w-5" />}
            color="purple"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <StatCard
            title="Impact Score"
            value="85"
            subtitle="Top 10% of donors"
            icon={<Zap className="h-5 w-5" />}
            color="orange"
          />
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Donations Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <ModernCard>
            <ModernCardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-100 rounded-xl">
                    <Activity className="h-5 w-5 text-cyan-600" />
                  </div>
                  <div>
                    <ModernCardTitle>Donation Activity</ModernCardTitle>
                    <p className="text-sm text-gray-500 mt-1">Monthly contribution trends</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  View All →
                </motion.button>
              </div>
            </ModernCardHeader>
            <ModernCardContent>
              <div className="h-64">
                {monthlyDonations.length > 0 ? (
                  <Line data={monthlyChartData} options={chartOptions} />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BarChart3 className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-400 font-medium">No data available yet</p>
                      <p className="text-gray-400 text-sm mt-1">Start donating to see your activity</p>
                    </div>
                  </div>
                )}
              </div>
            </ModernCardContent>
          </ModernCard>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <ModernCard>
            <ModernCardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-xl">
                    <Award className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <ModernCardTitle>Impact by Category</ModernCardTitle>
                    <p className="text-sm text-gray-500 mt-1">Where your donations go</p>
                  </div>
                </div>
              </div>
            </ModernCardHeader>
            <ModernCardContent>
              <div className="h-64">
                {categoryBreakdown.length > 0 ? (
                  <div className="relative">
                    <Doughnut data={categoryChartData} options={doughnutOptions} />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-gray-900">{categoryBreakdown.length}</p>
                        <p className="text-sm text-gray-500">Categories</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Award className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-400 font-medium">No category data yet</p>
                      <p className="text-gray-400 text-sm mt-1">Donate to see your impact</p>
                    </div>
                  </div>
                )}
              </div>
            </ModernCardContent>
          </ModernCard>
        </motion.div>
      </div>

      {/* Recent Activity Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <ModernCard>
          <ModernCardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <ModernCardTitle>Recent Activity</ModernCardTitle>
                  <p className="text-sm text-gray-500 mt-1">Your latest actions and achievements</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                View All →
              </motion.button>
            </div>
          </ModernCardHeader>
          <ModernCardContent>
            <div className="space-y-4">
              <AnimatePresence>
                {recentActivities.map((activity, i) => {
                  const Icon = activity.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + (i * 0.1) }}
                      whileHover={{ x: 4 }}
                      className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-all cursor-pointer group"
                    >
                      <div className="p-2 bg-gray-100 rounded-xl group-hover:bg-gray-200 transition-colors">
                        <Icon className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{activity.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {activity.amount && (
                            <span className="text-sm font-semibold text-green-600">{activity.amount}</span>
                          )}
                          <span className="text-sm text-gray-500">• {activity.time}</span>
                        </div>
                      </div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        className="text-gray-400"
                      >
                        →
                      </motion.div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </ModernCardContent>
        </ModernCard>
      </motion.div>
    </motion.div>
  );
}