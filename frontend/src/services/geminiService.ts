const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AIResponse {
  message: string;
  error?: string;
}

class GeminiService {
  private chatHistory: ChatMessage[] = [];

  async sendMessage(message: string): Promise<AIResponse> {
    try {
      // Add user message to history
      this.chatHistory.push({
        role: 'user',
        content: message,
        timestamp: new Date()
      });

      const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          history: this.chatHistory.slice(0, -1) // Don't include the current message
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Add assistant response to history
      this.chatHistory.push({
        role: 'assistant',
        content: data.message,
        timestamp: new Date(data.timestamp)
      });

      return {
        message: data.message
      };
    } catch (error) {
      console.error('AI Service Error:', error);
      return {
        message: '',
        error: 'Failed to get response from AI assistant. Please try again.'
      };
    }
  }

  getChatHistory(): ChatMessage[] {
    return this.chatHistory;
  }

  clearChatHistory(): void {
    this.chatHistory = [];
  }

  async getQuickResponse(message: string): Promise<AIResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/quick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      return {
        message: data.message
      };
    } catch (error) {
      console.error('AI Service Error:', error);
      return {
        message: '',
        error: 'Failed to get response from AI assistant. Please try again.'
      };
    }
  }
}

export const geminiService = new GeminiService();
