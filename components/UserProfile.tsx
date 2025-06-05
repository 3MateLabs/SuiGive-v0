"use client";

/**
 * User Profile Component
 * 
 * This component displays and allows editing of a user profile in the SuiGive platform.
 * It integrates with the wallet connection and the user profile API.
 */

import React, { useState } from 'react';
import { useUserProfile, UserProfile as UserProfileType, ProfileUpdateData } from '../hooks/useUserProfile';
import Image from 'next/image';
import { ConnectButton } from '@mysten/dapp-kit';

interface UserProfileProps {
  editable?: boolean;
  showDonations?: boolean;
  showCampaigns?: boolean;
  compact?: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  editable = true,
  showDonations = true,
  showCampaigns = true,
  compact = false
}) => {
  const { profile, isLoading, error, updateProfile, fetchProfile, isConnected, walletAddress } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileUpdateData>({
    displayName: '',
    bio: '',
    profileImage: '',
    email: '',
    website: '',
    twitter: '',
    discord: '',
    isPrivate: false,
    showEmail: false,
    showSocial: true
  });

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    setFormData({
      ...formData,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value
    });
  };

  // Start editing mode
  const handleEdit = () => {
    setFormData({
      displayName: profile?.displayName || '',
      bio: profile?.bio || '',
      profileImage: profile?.profileImage || '',
      email: profile?.email || '',
      website: profile?.website || '',
      twitter: profile?.twitter || '',
      discord: profile?.discord || '',
      isPrivate: profile?.isPrivate || false,
      showEmail: profile?.showEmail || false,
      showSocial: profile?.showSocial !== false // Default to true
    });
    setIsEditing(true);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateProfile(formData);
    
    if (success) {
      setIsEditing(false);
    }
  };
  
  // Retry profile fetch if there was an error
  const handleRetryFetch = async () => {
    if (walletAddress) {
      await fetchProfile(walletAddress);
    }
  };

  // Format donation amount for display
  const formatAmount = (amount: string | undefined) => {
    try {
      if (!amount) return '0.00';
      const bigAmount = BigInt(amount);
      return (Number(bigAmount) / 1_000_000_000).toFixed(2);
    } catch (e) {
      return '0.00';
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">User Profile</h2>
        <p className="mb-4">Connect your wallet to view your profile</p>
        <ConnectButton />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-6 bg-white rounded-lg shadow-md">
        <div className="animate-pulse text-xl">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Error Loading Profile</h2>
        <p className="text-red-500 mb-4">Failed to fetch user profile</p>
        
        {isConnected && (
          <button 
            onClick={handleRetryFetch}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 mr-2"
          >
            Retry
          </button>
        )}
        
        <div className="mt-4">
          <ConnectButton />
        </div>
      </div>
    );
  }

  // Edit mode
  if (isEditing && editable) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Display Name</label>
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Profile Image URL</label>
            <input
              type="text"
              name="profileImage"
              value={formData.profileImage}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="https://example.com/image.jpg"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Website</label>
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Twitter</label>
            <input
              type="text"
              name="twitter"
              value={formData.twitter}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Discord</label>
            <input
              type="text"
              name="discord"
              value={formData.discord}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isPrivate"
                checked={formData.isPrivate}
                onChange={handleChange}
                className="mr-2"
              />
              <span>Private Profile</span>
            </label>
          </div>
          
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="showEmail"
                checked={formData.showEmail}
                onChange={handleChange}
                className="mr-2"
              />
              <span>Show Email Publicly</span>
            </label>
          </div>
          
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="showSocial"
                checked={formData.showSocial}
                onChange={handleChange}
                className="mr-2"
              />
              <span>Show Social Links Publicly</span>
            </label>
          </div>
          
          <div className="flex space-x-4">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Save Profile
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  // View mode
  return (
    <div className={`${compact ? 'p-4' : 'p-6'} bg-white rounded-lg shadow-md`}>
      <div className="flex items-center mb-4">
        {profile?.profileImage ? (
          <div className="mr-4">
            <Image
              src={profile.profileImage}
              alt={profile.displayName || 'User'}
              width={compact ? 48 : 80}
              height={compact ? 48 : 80}
              className="rounded-full"
            />
          </div>
        ) : (
          <div className={`${compact ? 'w-12 h-12' : 'w-20 h-20'} bg-gray-200 rounded-full mr-4 flex items-center justify-center`}>
            <span className={`${compact ? 'text-xl' : 'text-3xl'} text-gray-500`}>
              {profile?.displayName?.charAt(0) || walletAddress?.charAt(0) || '?'}
            </span>
          </div>
        )}
        
        <div>
          <h2 className={`${compact ? 'text-lg' : 'text-2xl'} font-bold`}>
            {profile?.displayName || 'Anonymous User'}
          </h2>
          <p className="text-gray-500 text-sm truncate">
            {walletAddress}
          </p>
        </div>
        
        {editable && !compact && (
          <button
            onClick={handleEdit}
            className="ml-auto px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
          >
            Edit Profile
          </button>
        )}
      </div>
      
      {!compact && profile?.bio && (
        <div className="mb-4">
          <p className="text-gray-700">{profile.bio}</p>
        </div>
      )}
      
      {!compact && (
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Donation Stats</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 p-2 rounded">
              <p className="text-sm text-gray-500">Total Donated</p>
              <p className="font-bold">{formatAmount(profile?.totalDonated || '0')} SUI</p>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <p className="text-sm text-gray-500">Campaigns Supported</p>
              <p className="font-bold">{profile?.donationCount || 0}</p>
            </div>
          </div>
        </div>
      )}
      
      {!compact && profile?.badges && profile.badges.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Badges</h3>
          <div className="flex flex-wrap gap-2">
            {profile.badges.map((badge: string) => (
              <span
                key={badge}
                className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
              >
                {badge.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {!compact && showCampaigns && profile?.createdCampaigns && profile.createdCampaigns.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Created Campaigns</h3>
          <div className="space-y-2">
            {profile.createdCampaigns.map((campaign: any) => (
              <div key={campaign.id} className="flex items-center bg-gray-50 p-2 rounded">
                {campaign.imageUrl && (
                  <Image
                    src={campaign.imageUrl}
                    alt={campaign.name}
                    width={40}
                    height={40}
                    className="rounded mr-2"
                  />
                )}
                <div>
                  <p className="font-medium">{campaign.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatAmount(campaign.currentAmount)} / {formatAmount(campaign.goalAmount)} SUI
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {!compact && (profile?.email || profile?.website || profile?.twitter || profile?.discord) && (
        <div>
          <h3 className="font-semibold mb-2">Contact</h3>
          <div className="space-y-1">
            {profile?.showEmail && profile?.email && (
              <p className="text-sm">
                <span className="font-medium">Email:</span> {profile.email}
              </p>
            )}
            {profile?.showSocial && (
              <>
                {profile?.website && (
                  <p className="text-sm">
                    <span className="font-medium">Website:</span>{' '}
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      {profile.website}
                    </a>
                  </p>
                )}
                {profile?.twitter && (
                  <p className="text-sm">
                    <span className="font-medium">Twitter:</span>{' '}
                    <a href={`https://twitter.com/${profile.twitter}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      @{profile.twitter}
                    </a>
                  </p>
                )}
                {profile?.discord && (
                  <p className="text-sm">
                    <span className="font-medium">Discord:</span> {profile.discord}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
