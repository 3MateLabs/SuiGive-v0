import { Campaign } from './sui-campaigns';

// Mock campaign data for development purposes
export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: '0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234',
    name: 'Clean Water Initiative',
    description: 'Providing clean water solutions to communities in need across developing regions.',
    imageUrl: 'https://images.unsplash.com/photo-1541675154750-0444c7d51e8e?auto=format&fit=crop&w=600&q=80',
    goalAmount: '5000000000000', // 5,000 SUI (in MIST)
    currentAmount: '2500000000000', // 2,500 SUI (in MIST)
    deadline: (Date.now() + 30 * 24 * 60 * 60 * 1000).toString(), // 30 days from now
    category: 'Environment',
    creator: '0xabcdef123456789abcdef123456789abcdef123456789abcdef123456789abc',
    createdAt: (Date.now() - 15 * 24 * 60 * 60 * 1000).toString() // 15 days ago
  },
  {
    id: '0x234567890abcdef234567890abcdef234567890abcdef234567890abcdef2345',
    name: 'Education for All',
    description: 'Supporting educational programs for underprivileged children to ensure equal access to quality education.',
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&q=80',
    goalAmount: '10000000000000', // 10,000 SUI
    currentAmount: '7500000000000', // 7,500 SUI
    deadline: (Date.now() + 45 * 24 * 60 * 60 * 1000).toString(), // 45 days from now
    category: 'Education',
    creator: '0xbcdef123456789abcdef123456789abcdef123456789abcdef123456789abcd',
    createdAt: (Date.now() - 10 * 24 * 60 * 60 * 1000).toString() // 10 days ago
  },
  {
    id: '0x345678901abcdef345678901abcdef345678901abcdef345678901abcdef3456',
    name: 'Medical Research Fund',
    description: 'Funding critical medical research to find cures for rare diseases affecting millions worldwide.',
    imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80',
    goalAmount: '20000000000000', // 20,000 SUI
    currentAmount: '5000000000000', // 5,000 SUI
    deadline: (Date.now() + 60 * 24 * 60 * 60 * 1000).toString(), // 60 days from now
    category: 'Healthcare',
    creator: '0xcdef123456789abcdef123456789abcdef123456789abcdef123456789abcde',
    createdAt: (Date.now() - 5 * 24 * 60 * 60 * 1000).toString() // 5 days ago
  },
  {
    id: '0x456789012abcdef456789012abcdef456789012abcdef456789012abcdef4567',
    name: 'Sustainable Farming Project',
    description: 'Implementing sustainable farming practices to combat climate change and improve food security.',
    imageUrl: 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?auto=format&fit=crop&w=600&q=80',
    goalAmount: '8000000000000', // 8,000 SUI
    currentAmount: '1000000000000', // 1,000 SUI
    deadline: (Date.now() + 50 * 24 * 60 * 60 * 1000).toString(), // 50 days from now
    category: 'Environment',
    creator: '0xdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef',
    createdAt: (Date.now() - 20 * 24 * 60 * 60 * 1000).toString() // 20 days ago
  },
  {
    id: '0x567890123abcdef567890123abcdef567890123abcdef567890123abcdef5678',
    name: 'Tech Innovation Hub',
    description: 'Creating a community innovation hub to foster technological development and entrepreneurship.',
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80',
    goalAmount: '15000000000000', // 15,000 SUI
    currentAmount: '9000000000000', // 9,000 SUI
    deadline: (Date.now() + 40 * 24 * 60 * 60 * 1000).toString(), // 40 days from now
    category: 'Technology',
    creator: '0xef123456789abcdef123456789abcdef123456789abcdef123456789abcdef1',
    createdAt: (Date.now() - 25 * 24 * 60 * 60 * 1000).toString() // 25 days ago
  }
];

// Function to get mock campaign by ID
export function getMockCampaignById(id: string): Campaign | null {
  return MOCK_CAMPAIGNS.find(campaign => campaign.id === id) || null;
}
