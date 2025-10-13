// FloatingChatbot Component - MANDATORY PATTERN
import { useState } from 'react';
import { 
  ChatBubbleLeftRightIcon, 
  XMarkIcon, 
  PaperAirplaneIcon,
  LightBulbIcon,
  QuestionMarkCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Hello! I\'m your Voting System by Mrj assistant. I have full knowledge about our voting system. How can I help you today?',
      isBot: true,
      timestamp: new Date(),
      sender: 'Voting System by Mrj assistant'
    }
  ]);

  const quickQuestions = [
    'How do I vote for candidates?',
    'What are the voting categories?',
    'How does the voting system work?'
  ];

  const handleQuickQuestion = (question) => {
    setMessage(question);
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

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: 'Thank you for your question! This is a demo response. In a real implementation, this would connect to an AI assistant.',
        isBot: true,
        timestamp: new Date(),
        sender: 'Voting System by Mrj assistant'
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
                  <span className="text-sm font-medium text-gray-700">Quick questions you can ask:</span>
                </div>
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
