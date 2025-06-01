"use client";

import { useEffect } from 'react';
import useSWR from 'swr';
import { useSuiClient } from '@mysten/dapp-kit';
import { SuiClient } from '@mysten/sui/client';

// Cache time in milliseconds (5 minutes)
const CACHE_TIME = 5 * 60 * 1000;

// Shorter cache time for frequently changing data (30 seconds)
const SHORT_CACHE_TIME = 30 * 1000;

// Longer cache time for rarely changing data (15 minutes)
const LONG_CACHE_TIME = 15 * 60 * 1000;

// Define fetcher functions for different types of blockchain data
const fetchers = {
  // Fetch coins for a specific owner and coin type
  getCoins: async (client: SuiClient, owner: string, coinType: string) => {
    if (!owner) return null;
    const coins = await client.getCoins({
      owner,
      coinType
    });
    return coins;
  },
  
  // Fetch object data
  getObject: async (client: SuiClient, objectId: string) => {
    if (!objectId) return null;
    return await client.getObject({
      id: objectId,
      options: {
        showContent: true,
        showDisplay: true,
      }
    });
  },
  
  // Fetch multiple objects
  getObjects: async (client: SuiClient, objectIds: string[]) => {
    if (!objectIds || objectIds.length === 0) return [];
    return await client.multiGetObjects({
      ids: objectIds,
      options: {
        showContent: true,
        showDisplay: true,
      }
    });
  }
};

// Hook for fetching coins with caching
export function useCachedCoins(owner: string | undefined, coinType: string) {
  const client = useSuiClient();
  
  const { data, error, mutate } = useSWR(
    owner ? ['getCoins', owner, coinType] : null,
    () => fetchers.getCoins(client, owner!, coinType),
    {
      revalidateOnFocus: false,
      dedupingInterval: SHORT_CACHE_TIME, // Use shorter cache time for coins as they change frequently
      refreshInterval: SHORT_CACHE_TIME * 2, // Refresh every minute instead of every 30 seconds
      errorRetryCount: 3,
      errorRetryInterval: 5000, // Wait 5 seconds between retries
      focusThrottleInterval: 10000, // Throttle focus events to prevent too many requests
      loadingTimeout: 10000 // Set a timeout for loading state
    }
  );
  
  return {
    coins: data?.data || [],
    isLoading: !error && !data,
    isError: error,
    refresh: mutate
  };
}

// Hook for fetching a single object with caching
export function useCachedObject(objectId: string | undefined) {
  const client = useSuiClient();
  
  const { data, error, mutate } = useSWR(
    objectId ? ['getObject', objectId] : null,
    () => fetchers.getObject(client, objectId!),
    {
      revalidateOnFocus: false,
      dedupingInterval: CACHE_TIME, // Standard cache time for objects
      refreshInterval: CACHE_TIME * 2, // Refresh less frequently for objects
      errorRetryCount: 3,
      errorRetryInterval: 5000, // Wait 5 seconds between retries
      focusThrottleInterval: 10000, // Throttle focus events
      loadingTimeout: 10000 // Set a timeout for loading state
    }
  );
  
  return {
    object: data,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate
  };
}

// Hook for fetching multiple objects with caching
export function useCachedObjects(objectIds: string[] | undefined) {
  const client = useSuiClient();
  
  const { data, error, mutate } = useSWR(
    objectIds && objectIds.length > 0 ? ['getObjects', objectIds.join(',')] : null,
    () => fetchers.getObjects(client, objectIds!),
    {
      revalidateOnFocus: false,
      dedupingInterval: CACHE_TIME, // Standard cache time for objects
      refreshInterval: CACHE_TIME * 2, // Refresh less frequently for multiple objects
      errorRetryCount: 3,
      errorRetryInterval: 5000, // Wait 5 seconds between retries
      focusThrottleInterval: 10000, // Throttle focus events
      loadingTimeout: 15000 // Longer timeout for multiple objects
    }
  );
  
  return {
    objects: data || [],
    isLoading: !error && !data,
    isError: error,
    refresh: mutate
  };
}
