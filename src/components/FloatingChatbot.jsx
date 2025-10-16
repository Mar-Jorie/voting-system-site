// FloatingChatbot Component - MANDATORY PATTERN
import { useState, useEffect } from 'react';
import { 
  ChatBubbleLeftRightIcon, 
  XMarkIcon, 
  PaperAirplaneIcon,
  LightBulbIcon,
  QuestionMarkCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import apiClient from '../usecases/api';

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Hello! I\'m your Corporate Party 2025 Outstanding Guest Awards assistant. I can help you with voting procedures, viewing results, event information, and answer any questions about our voting system. How can I help you today?',
      isBot: true,
      timestamp: new Date(),
      sender: 'Voting System assistant'
    }
  ]);

  // Load FAQs from database
  useEffect(() => {
    const loadFAQs = async () => {
      try {
        const faqData = await apiClient.findObjects('faqs', {});
        setFaqs(faqData || []);
      } catch (error) {
        // Error loading FAQs - handled silently
        setFaqs([]);
      } finally {
        setLoading(false);
      }
    };

    loadFAQs();
  }, []);

  // Generate quick questions from database FAQs
  const quickQuestions = faqs.length > 0 
    ? faqs.slice(0, 6).map(faq => faq.question)
    : [
        'How do I vote for outstanding guests?',
        'What are the male and female categories?',
        'When is the Corporate Party 2025 event?',
        'How do I view the voting results?',
        'Is my vote secure and private?',
        'Can I change my vote after submitting?'
      ];

  const handleQuickQuestion = (question) => {
    setMessage(question);
  };

  const getBotResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    // First, try to find a matching FAQ from database
    if (faqs.length > 0) {
      // Check for exact question match
      const exactMatch = faqs.find(faq => 
        faq.question.toLowerCase() === userMessage.toLowerCase()
      );
      if (exactMatch) {
        return exactMatch.answer;
      }
      
      // Check for keyword matches
      const keywordMatch = faqs.find(faq => {
        if (faq.keywords && faq.keywords.length > 0) {
          return faq.keywords.some(keyword => 
            message.includes(keyword.toLowerCase())
          );
        }
        return false;
      });
      if (keywordMatch) {
        return keywordMatch.answer;
      }
      
      // Check for partial question matches
      const partialMatch = faqs.find(faq => {
        const faqWords = faq.question.toLowerCase().split(' ');
        return faqWords.some(word => 
          word.length > 3 && message.includes(word)
        );
      });
      if (partialMatch) {
        return partialMatch.answer;
      }
    }
    
    // Fallback to hardcoded responses if no FAQ match found
    if (message.includes('how do i vote') || message.includes('vote for outstanding guests')) {
      return 'To vote for outstanding guests, click the "Cast Vote" or "Start Voting" button on the page. You\'ll need to select one male and one female guest who made the biggest impact at our Corporate Party 2025 event. Don\'t forget to provide your email address to submit your vote!';
    }
    
    if (message.includes('male and female categories') || message.includes('categories')) {
      return 'Our voting system has two categories: Male Outstanding Guest and Female Outstanding Guest. You must select one candidate from each category to complete your vote. This ensures we recognize outstanding guests from both categories fairly.';
    }
    
    if (message.includes('when is the corporate party') || message.includes('event date')) {
      return 'The Corporate Party 2025 Outstanding Guest Awards event is scheduled for October 18, 2025 at ICCT Main Campus. This voting system allows you to select the guests who made the biggest impact during this special celebration.';
    }
    
    if (message.includes('view results') || message.includes('voting results')) {
      return 'You can view the current voting results in real-time on the landing page! Scroll down to the "Current Voting Results" section to see live vote counts, winners, and detailed statistics for both male and female categories.';
    }
    
    if (message.includes('secure') || message.includes('private')) {
      return 'Yes, your vote is completely secure and private! We use advanced security measures and one-vote-per-email validation to ensure the integrity of the voting process. Your personal information is protected and your vote remains confidential.';
    }
    
    if (message.includes('change my vote') || message.includes('modify vote')) {
      return 'Unfortunately, you cannot change your vote once it has been submitted. This ensures the fairness and integrity of the voting process. Please make sure you\'re satisfied with your selections before clicking submit.';
    }
    
    if (message.includes('outstanding guest') || message.includes('award')) {
      return 'The Outstanding Guest Awards recognize guests who made the biggest impact during our Corporate Party 2025 celebration on October 18, 2025 at ICCT Main Campus. You can vote for one male and one female guest who you believe deserve this recognition.';
    }
    
    if (message.includes('help') || message.includes('support')) {
      return 'I\'m here to help you with the Corporate Party 2025 Outstanding Guest Awards voting system! You can ask me about how to vote, view results, event details, or any other questions about the voting process.';
    }
    
    // Default response
    return 'Thank you for your question about the Corporate Party 2025 Outstanding Guest Awards voting system! I can help you with voting procedures, viewing results, event information, and more. Feel free to ask me anything!';
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: message,
      isBot: false,
      timestamp: new Date(),
      sender: 'You'
    };

    setMessages(prev => [...prev, userMessage]);

    // Generate bot response
    setTimeout(() => {
      const responseText = getBotResponse(message);
      const botResponse = {
        id: messages.length + 2,
        text: responseText,
        isBot: true,
        timestamp: new Date(),
        sender: 'Voting System assistant'
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);

    setMessage('');
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-80">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="h-4 w-4 text-white" />
              </div>
              <h3 className="font-semibold text-sm">Chat Support</h3>
            </div>
          </div>

          {/* Messages */}
          <div className="h-80 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-2">
                {msg.isBot && (
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-medium text-gray-600">{msg.sender}</span>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <ClockIcon className="h-3 w-3" />
                      <span>{msg.timestamp.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: false 
                      })}</span>
                    </div>
                  </div>
                )}
                <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                  msg.isBot ? 'bg-gray-100 text-gray-900' : 'bg-primary-600 text-white'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {/* Quick Questions Section */}
            {messages.length === 1 && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <LightBulbIcon className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {loading ? 'Loading FAQs...' : 'Quick questions you can ask:'}
                  </span>
                </div>
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-full p-2 bg-gray-50 rounded-lg animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {quickQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickQuestion(question)}
                        className="w-full text-left p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 flex items-center space-x-2 transition-colors"
                      >
                        <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span>{question}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="w-10 h-10 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Chat Button - Always in bottom-right corner */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 w-14 h-14 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 z-80"
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? <XMarkIcon className="h-6 w-6" /> : <ChatBubbleLeftRightIcon className="h-6 w-6" />}
      </button>
    </>
  );
};

export default FloatingChatbot;
