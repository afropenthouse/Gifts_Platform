import React from 'react';
import './AIFloatingButton.css';

interface AIFloatingButtonProps {
  onClick: () => void;
}

const AIFloatingButton: React.FC<AIFloatingButtonProps> = ({ onClick }) => {
  return (
    <button 
      className="ai-floating-button"
      onClick={onClick}
      title="AI Assistant"
    >
      <div className="ai-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 6.5V7.5C15 8.6 14.1 9.5 13 9.5C11.9 9.5 11 8.6 11 7.5V6.5L9 7V9C9 10.1 9.9 11 11 11H13C14.1 11 15 10.1 15 9H21ZM7 9V7L1 6.5V7.5C1 8.6 1.9 9.5 3 9.5C4.1 9.5 5 8.6 5 7.5V6.5L7 7V9ZM12 12C10.9 12 10 11.1 10 10C10 8.9 10.9 8 12 8C13.1 8 14 8.9 14 10C14 11.1 13.1 12 12 12ZM8 14C8 12.9 8.9 12 10 12H14C15.1 12 16 12.9 16 14V20C16 21.1 15.1 22 14 22H10C8.9 22 8 21.1 8 20V14Z" fill="white"/>
        </svg>
      </div>
      <span className="ai-text">AI</span>
    </button>
  );
};

export default AIFloatingButton;
