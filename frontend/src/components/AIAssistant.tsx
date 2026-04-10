import React, { useState, useRef, useEffect } from 'react';
import { geminiService, ChatMessage } from '../services/geminiService';
import './AIAssistant.css';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setError(null);
    setIsLoading(true);

    try {
      const response = await geminiService.sendMessage(userMessage);
      
      if (response.error) {
        setError(response.error);
      } else {
        setMessages(geminiService.getChatHistory());
      }
    } catch (err) {
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    geminiService.clearChatHistory();
    setMessages([]);
    setError(null);
  };

  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="ai-assistant-overlay">
      <div className="ai-assistant-container">
        <div className="ai-assistant-header">
          <div className="ai-assistant-title">
            <h3>BeThere Experience Assistant</h3>
          </div>
          <div className="ai-assistant-actions">
            <button 
              className="clear-chat-btn" 
              onClick={clearChat}
              title="Clear chat"
            >
              Clear
            </button>
            <button 
              className="close-btn" 
              onClick={onClose}
              title="Close"
            >
              ×
            </button>
          </div>
        </div>

        <div className="ai-assistant-messages">
          {messages.length === 0 && (
            <div className="welcome-message">
              <p>Hi! I'm your BeThere Experience assistant. I can help you with:</p>
              <ul>
                <li>Event planning and management</li>
                <li>Guest coordination and RSVP tracking</li>
                <li>Budget planning and vendor payments</li>
                <li>And much more!</li>
              </ul>
              <p>How can I help you today?</p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
            >
              <div className="message-content">
                <p>{message.content}</p>
                <span className="message-time">
                  {formatTimestamp(message.timestamp)}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message assistant-message">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="ai-assistant-input">
          <div className="input-container">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about event planning..."
              disabled={isLoading}
              className="message-input"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="send-button"
            >
              {isLoading ? '...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
