import React, { useState, useEffect } from 'react';
import { requestMonitor } from '../lib/request-monitor';

/**
 * Component to display API request monitoring statistics
 */
export default function RequestMonitor() {
  const [stats, setStats] = useState<{
    requestsPerMinute: number;
    successRate: number;
    endpointBreakdown: Record<string, number>;
    activeConcurrency: number;
    maxConcurrency: number;
    avgResponseTime: number;
    failureRate: number;
  }>({
    requestsPerMinute: 0,
    successRate: 0,
    endpointBreakdown: {},
    activeConcurrency: 0,
    maxConcurrency: 0,
    avgResponseTime: 0,
    failureRate: 0
  });
  
  const [isExpanded, setIsExpanded] = useState(false);
  
  useEffect(() => {
    // Update stats every 5 seconds instead of every second
    // This reduces unnecessary re-renders
    const interval = setInterval(() => {
      const currentStats = requestMonitor.getStats();
      setStats({
        requestsPerMinute: currentStats.requestsPerMinute,
        successRate: currentStats.successRate,
        endpointBreakdown: currentStats.endpointBreakdown,
        activeConcurrency: currentStats.activeConcurrency,
        maxConcurrency: currentStats.maxConcurrency,
        avgResponseTime: currentStats.avgResponseTime,
        failureRate: currentStats.failureRate
      });
    }, 5000); // Changed from 1000ms to 5000ms
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3 z-50 text-sm">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">API Monitor</h3>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {isExpanded ? '▼' : '▲'}
        </button>
      </div>
      
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 dark:text-gray-400">Req/min</span>
          <span className={`font-mono ${stats.requestsPerMinute > 30 ? 'text-amber-500' : 'text-green-500'}`}>
            {stats.requestsPerMinute}
          </span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 dark:text-gray-400">Success</span>
          <span className={`font-mono ${stats.successRate < 90 ? 'text-red-500' : 'text-green-500'}`}>
            {stats.successRate.toFixed(1)}%
          </span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 dark:text-gray-400">Concurrency</span>
          <span className={`font-mono ${stats.activeConcurrency > 3 ? 'text-amber-500' : 'text-green-500'}`}>
            {stats.activeConcurrency}/{stats.maxConcurrency}
          </span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 dark:text-gray-400">Resp Time</span>
          <span className={`font-mono ${stats.avgResponseTime > 1000 ? 'text-red-500' : stats.avgResponseTime > 500 ? 'text-amber-500' : 'text-green-500'}`}>
            {stats.avgResponseTime.toFixed(0)}ms
          </span>
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-2">
          <div className="flex justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-300">Performance</h4>
            <span className="text-xs text-gray-500">
              Failures: <span className={`${stats.failureRate > 5 ? 'text-red-500' : 'text-gray-500'}`}>
                {stats.failureRate.toFixed(1)}%
              </span>
            </span>
          </div>
          
          <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Endpoints</h4>
          <div className="max-h-32 overflow-y-auto">
            {Object.entries(stats.endpointBreakdown).map(([endpoint, count]) => (
              <div key={endpoint} className="flex justify-between text-xs mb-1">
                <span className="truncate max-w-[150px]" title={endpoint}>
                  {endpoint.split('/').pop()}
                </span>
                <span className="font-mono">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
