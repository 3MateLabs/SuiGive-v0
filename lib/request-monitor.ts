/**
 * Request monitoring utility for tracking API request rates
 */

// Track requests with timestamps
interface RequestRecord {
  timestamp: number;
  endpoint: string;
  success: boolean;
  duration?: number;
  retryCount?: number;
}

class RequestMonitor {
  private static instance: RequestMonitor;
  private requests: RequestRecord[] = [];
  private maxRecords = 100; // Keep last 100 requests
  private lastRequestTimestamps: Record<string, number> = {}; // Track timestamps by endpoint
  private minRequestInterval = 2000; // Minimum 2 seconds between identical requests
  private isEnabled = false; // Disabled for production
  
  private constructor() {}
  
  public static getInstance(): RequestMonitor {
    if (!RequestMonitor.instance) {
      RequestMonitor.instance = new RequestMonitor();
    }
    return RequestMonitor.instance;
  }
  
  /**
   * Record a new API request
   */
  // Track active requests to calculate concurrency
  private activeRequests = 0;
  private maxConcurrentRequests = 0;
  private totalDuration = 0;
  private totalRequests = 0;
  
  /**
   * Record the start of an API request
   */
  public startRequest(endpoint: string): number {
    if (!this.isEnabled) return Date.now();
    
    this.activeRequests++;
    
    // Update max concurrent requests if needed
    if (this.activeRequests > this.maxConcurrentRequests) {
      this.maxConcurrentRequests = this.activeRequests;
    }
    
    return Date.now();
  }
  
  /**
   * Record a completed API request
   */
  public recordRequest(endpoint: string, success: boolean, startTime?: number, retryCount: number = 0): void {
    if (!this.isEnabled) return;
    
    // Calculate duration if startTime is provided
    const timestamp = Date.now();
    const duration = startTime ? timestamp - startTime : undefined;
    
    // Decrement active requests counter
    if (this.activeRequests > 0) {
      this.activeRequests--;
    }
    
    // Update metrics
    if (duration) {
      this.totalDuration += duration;
      this.totalRequests++;
    }
    
    this.requests.push({
      timestamp,
      endpoint,
      success,
      duration,
      retryCount
    });
    
    // Trim the records if needed
    if (this.requests.length > this.maxRecords) {
      this.requests = this.requests.slice(-this.maxRecords);
    }
    
    // Log to console for debugging
    console.debug(`API Request: ${endpoint} - ${success ? 'Success' : 'Failed'}`);
  }
  
  /**
   * Get the current request rate (requests per minute)
   */
  public getRequestRate(timeWindowMs: number = 60000): { total: number, success: number, failed: number } {
    const now = Date.now();
    const cutoff = now - timeWindowMs;
    
    const recentRequests = this.requests.filter(r => r.timestamp >= cutoff);
    const successfulRequests = recentRequests.filter(r => r.success);
    
    return {
      total: recentRequests.length,
      success: successfulRequests.length,
      failed: recentRequests.length - successfulRequests.length
    };
  }
  
  /**
   * Get detailed statistics about request rates
   */
  public getStats(): {
    requestsPerMinute: number;
    successRate: number;
    recentRequests: RequestRecord[];
    endpointBreakdown: Record<string, number>;
    activeConcurrency: number;
    maxConcurrency: number;
    avgResponseTime: number;
    failureRate: number;
  } {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentRequests = this.requests.filter(r => r.timestamp >= oneMinuteAgo);
    
    // Calculate endpoint breakdown
    const endpointBreakdown: Record<string, number> = {};
    recentRequests.forEach(r => {
      endpointBreakdown[r.endpoint] = (endpointBreakdown[r.endpoint] || 0) + 1;
    });
    
    // Calculate average response time from requests with duration
    const requestsWithDuration = recentRequests.filter(r => r.duration !== undefined);
    const avgResponseTime = requestsWithDuration.length > 0 ?
      requestsWithDuration.reduce((sum, r) => sum + (r.duration || 0), 0) / requestsWithDuration.length :
      this.totalRequests > 0 ? this.totalDuration / this.totalRequests : 0;
    
    // Calculate failure rate
    const failedRequests = recentRequests.filter(r => !r.success);
    const failureRate = recentRequests.length > 0 ?
      (failedRequests.length / recentRequests.length) * 100 : 0;
    
    return {
      requestsPerMinute: recentRequests.length,
      successRate: recentRequests.length ? 
        recentRequests.filter(r => r.success).length / recentRequests.length * 100 : 0,
      recentRequests: recentRequests.slice(-10), // Last 10 requests
      endpointBreakdown,
      activeConcurrency: this.activeRequests,
      maxConcurrency: this.maxConcurrentRequests,
      avgResponseTime,
      failureRate
    };
  }
  
  /**
   * Log current stats to console
   */
  public logStats(): void {
    const stats = this.getStats();
    console.log('=== API Request Monitor Stats ===');
    console.log(`Requests per minute: ${stats.requestsPerMinute}`);
    console.log(`Success rate: ${stats.successRate.toFixed(1)}%`);
    console.log('Endpoint breakdown:', stats.endpointBreakdown);
    console.log('================================');
  }
  
  /**
   * Check if a request to an endpoint should be throttled
   */
  public shouldThrottleRequest(endpoint: string): boolean {
    // When monitoring is disabled, never throttle requests
    if (!this.isEnabled) return false;
    
    const now = Date.now();
    const lastRequestTime = this.lastRequestTimestamps[endpoint] || 0;
    
    // If the last request was too recent, throttle this one
    if (now - lastRequestTime < this.minRequestInterval) {
      return true;
    }
    
    // Update the last request timestamp for this endpoint
    this.lastRequestTimestamps[endpoint] = now;
    return false;
  }
}

// Export singleton instance
export const requestMonitor = RequestMonitor.getInstance();

// Cache for API responses
const apiCache: Record<string, {data: any, timestamp: number}> = {};

// Helper function to wrap API calls with caching and throttling
// Monitoring is disabled for production but caching is maintained for performance
export async function monitoredApiCall<T>(
  endpoint: string,
  apiCallFn: () => Promise<T>,
  retryCount: number = 0,
  cacheTimeMs: number = 30000 // Default 30 second cache
): Promise<T> {
  // Check if we have a cached response that's still valid
  const cachedResponse = apiCache[endpoint];
  const now = Date.now();
  
  if (cachedResponse && (now - cachedResponse.timestamp < cacheTimeMs)) {
    console.log(`Using cached response for ${endpoint} (age: ${(now - cachedResponse.timestamp)/1000}s)`);
    return cachedResponse.data as T;
  }
  
  // Check if this endpoint was recently called (throttling)
  const shouldThrottle = requestMonitor.shouldThrottleRequest(endpoint);
  if (shouldThrottle) {
    console.log(`Throttling request to ${endpoint} - using cached data if available`);
    // If we have any cached data (even expired), use it during throttling
    if (cachedResponse) {
      return cachedResponse.data as T;
    }
  }
  
  // If we get here, make the actual API call
  const startTime = requestMonitor.startRequest(endpoint);
  
  try {
    const result = await apiCallFn();
    requestMonitor.recordRequest(endpoint, true, startTime, retryCount);
    
    // Cache the successful response
    apiCache[endpoint] = {
      data: result,
      timestamp: Date.now()
    };
    
    return result;
  } catch (error) {
    requestMonitor.recordRequest(endpoint, false, startTime, retryCount);
    throw error;
  }
}
