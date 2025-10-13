// Initialize Mock Data for Voting System
export const initializeMockData = () => {
  // Check if data already exists
  const existingCandidates = localStorage.getItem('candidates');
  const existingVotes = localStorage.getItem('votes');

  if (!existingCandidates) {
    const mockCandidates = [
      {
        id: '1',
        name: 'John Smith',
        category: 'male',
        description: 'Experienced leader with a vision for the future.',
        image: null,
        votes: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Michael Johnson',
        category: 'male',
        description: 'Innovative thinker with strong community ties.',
        image: null,
        votes: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Sarah Johnson',
        category: 'female',
        description: 'Dedicated advocate for positive change.',
        image: null,
        votes: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: '4',
        name: 'Emily Davis',
        category: 'female',
        description: 'Passionate about community development and growth.',
        image: null,
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
