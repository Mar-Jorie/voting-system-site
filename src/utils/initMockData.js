// Initialize Mock Data for Voting System
export const initializeMockData = () => {
  // Check if data already exists
  const existingCandidates = localStorage.getItem('candidates');
  const existingVotes = localStorage.getItem('votes');
  const existingFAQs = localStorage.getItem('faqs');
  
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

  if (!existingFAQs) {
    const mockFAQs = [
      {
        id: 'faq-1',
        question: 'How do I vote in the election?',
        answer: 'To vote in the election, you need to select one male candidate and one female candidate from the available options. Click on your preferred candidates and then submit your vote. You can only vote once per election.',
        keywords: ['vote', 'election', 'candidate', 'male', 'female', 'submit'],
        category: 'voting',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'faq-2',
        question: 'What are the voting categories?',
        answer: 'The election has two categories: Male Category and Female Category. You must vote for one candidate in each category. The candidate with the most votes in each category will be declared the winner.',
        keywords: ['categories', 'male', 'female', 'winner', 'votes'],
        category: 'voting',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'faq-3',
        question: 'Can I change my vote after submitting?',
        answer: 'No, once you submit your vote, it cannot be changed. Please review your selections carefully before submitting. Each voter is allowed only one vote per election.',
        keywords: ['change', 'vote', 'submit', 'once', 'cannot'],
        category: 'voting',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'faq-4',
        question: 'How do I create an account?',
        answer: 'To create an account, click on the "Sign Up" button on the landing page. Fill in your personal information including first name, last name, email, username, and password. Choose your role and status, then submit the form.',
        keywords: ['account', 'signup', 'register', 'create', 'email', 'password'],
        category: 'account',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'faq-5',
        question: 'What user roles are available?',
        answer: 'The system supports three user roles: Admin (full system access), Moderator (limited administrative access), and User (basic voting access). Your role determines what features you can access in the system.',
        keywords: ['roles', 'admin', 'moderator', 'user', 'access', 'permissions'],
        category: 'account',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'faq-6',
        question: 'How do I view election results?',
        answer: 'Election results are displayed on the Dashboard page. You can see the winners for each category, detailed vote counts, and voting statistics. Results are updated in real-time as votes are cast.',
        keywords: ['results', 'dashboard', 'winners', 'statistics', 'real-time'],
        category: 'general',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'faq-7',
        question: 'What is the voting deadline?',
        answer: 'The voting deadline is set by the election administrators. Check the Dashboard or contact your system administrator for specific voting deadlines. Make sure to vote before the deadline expires.',
        keywords: ['deadline', 'voting', 'administrator', 'expire', 'time'],
        category: 'general',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'faq-8',
        question: 'How do I reset my password?',
        answer: 'If you need to reset your password, contact your system administrator. They can help you reset your password or create a new account if needed. Password resets are handled by administrators for security purposes.',
        keywords: ['password', 'reset', 'administrator', 'security', 'help'],
        category: 'account',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'faq-9',
        question: 'Can I view who voted for which candidates?',
        answer: 'The Votes List page shows all voting records including voter information, selected candidates, and voting timestamps. This information is available to administrators and moderators for transparency and audit purposes.',
        keywords: ['votes', 'list', 'transparency', 'audit', 'administrator', 'moderator'],
        category: 'general',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'faq-10',
        question: 'What should I do if I encounter technical issues?',
        answer: 'If you experience technical problems while voting or using the system, try refreshing your browser first. If the issue persists, contact your system administrator or technical support team. Make sure you have a stable internet connection.',
        keywords: ['technical', 'issues', 'problems', 'support', 'internet', 'browser'],
        category: 'technical',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    localStorage.setItem('faqs', JSON.stringify(mockFAQs));
  }
};

// Initialize data when the module is imported
initializeMockData();
