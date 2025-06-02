"use client"

import React from 'react';
import { useSuiCampaigns } from '@/hooks/useSuiCampaigns';
import DashboardCharts from './DashboardCharts';
import { RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function DashboardChartsWrapper() {
  const { campaigns, loading, error, refreshCampaigns } = useSuiCampaigns();

  // If loading or error, show appropriate UI
  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
          <h2 className="text-xl font-bold mb-4 sui-navy-text">Platform Overview</h2>
          <div className="h-64 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4 sui-navy-text">Platform Overview</h2>
          <div className="p-4 bg-red-50 rounded-lg text-red-600">
            <p>Error loading campaign data. Please try again later.</p>
            <button 
              onClick={() => {
                toast.loading('Refreshing data...', { id: 'refresh-dashboard' });
                refreshCampaigns()
                  .then(() => toast.success('Data refreshed!', { id: 'refresh-dashboard' }))
                  .catch(() => toast.error('Failed to refresh data', { id: 'refresh-dashboard' }));
              }}
              className="mt-2 flex items-center text-sm text-blue-600 hover:underline"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If no campaigns, show empty state
  if (campaigns.length === 0) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4 sui-navy-text">Platform Overview</h2>
          <div className="p-4 bg-gray-50 rounded-lg text-gray-600 text-center">
            <p>No campaigns found. Start creating campaigns to see analytics.</p>
          </div>
        </div>
      </div>
    );
  }

  // If we have campaigns, render the dashboard charts
  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl shadow-sm">
        <h2 className="text-2xl md:text-3xl font-bold text-sui-navy mb-2 md:mb-0">Platform Analytics</h2>
        <button 
          onClick={() => {
            toast.loading('Refreshing data...', { id: 'refresh-dashboard' });
            refreshCampaigns()
              .then(() => toast.success('Data refreshed!', { id: 'refresh-dashboard' }))
              .catch(() => toast.error('Failed to refresh data', { id: 'refresh-dashboard' }));
          }}
          className="self-start md:self-auto text-sm flex items-center bg-white px-4 py-2 rounded-lg shadow-sm text-sui-navy hover:bg-blue-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </button>
      </div>
      <DashboardCharts campaigns={campaigns} />
    </div>
  );
}
