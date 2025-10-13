// Initialize Mock Data for Voting System
export const initializeMockData = () => {
  // Check if data already exists
  const existingCandidates = localStorage.getItem('candidates');
  const existingVotes = localStorage.getItem('votes');
  
  // Force reinitialize for testing (remove this line in production)
  // localStorage.removeItem('candidates');

  if (!existingCandidates) {
    const mockCandidates = [
      {
        id: '1',
        name: 'John Smith',
        category: 'male',
        description: 'Experienced leader with a vision for the future.',
        images: [
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face'
        ],
        votes: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Michael Johnson',
        category: 'male',
        description: 'Innovative thinker with strong community ties.',
        images: [
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face',
          'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=400&fit=crop&crop=face'
        ],
        votes: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Sarah Johnson',
        category: 'female',
        description: 'Dedicated advocate for positive change.',
        images: [
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face'
        ],
        votes: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: '4',
        name: 'Emily Davis',
        category: 'female',
        description: 'Passionate about community development and growth.',
        images: [
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face'
        ],
        votes: 0,
        createdAt: new Date().toISOString()
      }
    ];

    localStorage.setItem('candidates', JSON.stringify(mockCandidates));
  }

  if (!existingVotes) {
    // Initialize with empty votes array
    localStorage.setItem('votes', JSON.stringify([]));
  }
};

// Initialize data when the module is imported
initializeMockData();
