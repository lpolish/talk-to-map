import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatWindowProps, Message } from '../types/chat';
import { Coordinates, MapType } from '../types/map';
import { renderMessageWithLinks } from '../utils/messageParser';
import { v4 as uuidv4 } from 'uuid';

// Storage key for the chat history
const CHAT_HISTORY_KEY = 'earthai_chat_history';

const ChatWindow: React.FC<ChatWindowProps> = ({
  currentMapState,
  onNavigate,
  initialWidth = 320,
  initialHeight = 480,
  positionClassName = "left-5 top-20"
}) => {
  // Initialize with welcome message or retrieve from localStorage
  const [messages, setMessages] = useState<Message[]>(() => {
    // Try to get stored messages from localStorage
    if (typeof window !== 'undefined') {
      const storedMessages = localStorage.getItem(CHAT_HISTORY_KEY);
      if (storedMessages) {
        try {
          const parsedMessages = JSON.parse(storedMessages);
          // Validate and convert timestamps back to Date objects
          if (Array.isArray(parsedMessages)) {
            return parsedMessages.map(msg => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }));
          }
        } catch (error) {
          console.error('Error parsing stored messages:', error);
        }
      }
    }
    
    // Default welcome message if no stored messages
    return [{
      id: uuidv4(),
      role: 'assistant',
      content: 'Hello! I am EarthAI, your satellite navigation assistant. How can I help you explore this location?',
      timestamp: new Date()
    }];
  });
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [wasDragged, setWasDragged] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartOffset = useRef({ x: 0, y: 0 });

  // Get current theme mode based on map type
  const isDarkMode = currentMapState?.mapType === 'dark';

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (chatInputRef.current) {
      chatInputRef.current.style.height = 'auto';
      chatInputRef.current.style.height = `${Math.min(chatInputRef.current.scrollHeight, 100)}px`;
    }
  }, [input]);

  // Custom dragging functionality
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!(e.target as HTMLElement).closest('.chat-header')) return;
    
    setIsDragging(true);
    
    // Store the initial mouse position
    dragStartPos.current = { 
      x: e.clientX, 
      y: e.clientY 
    };
    
    // Get current position on first drag
    if (!wasDragged) {
      const rect = chatWindowRef.current?.getBoundingClientRect();
      if (rect) {
        // Initialize position to current element position on first drag
        setPosition({ x: rect.left, y: rect.top });
        dragStartOffset.current = { x: rect.left, y: rect.top };
      }
    } else {
      dragStartOffset.current = { ...position };
    }
    
    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Prevent text selection during drag
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    // Calculate the new position
    const newX = dragStartOffset.current.x + (e.clientX - dragStartPos.current.x);
    const newY = dragStartOffset.current.y + (e.clientY - dragStartPos.current.y);
    
    // Set the new position
    setPosition({ x: newX, y: newY });
    setWasDragged(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Send a message to the AI
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Generate a unique session ID for this chat session
    const sessionId = localStorage.getItem('chat_session_id') || uuidv4();
    if (!localStorage.getItem('chat_session_id')) {
      localStorage.setItem('chat_session_id', sessionId);
    }

    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    // Update messages state with the new user message
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Create the full conversation history for context
      const conversationHistory = updatedMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Call the AI chat API with the current map context and complete history
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: input,
          location: currentMapState?.locationName || 'Unknown location',
          coordinates: currentMapState?.center,
          zoom: currentMapState?.zoom,
          mapType: currentMapState?.mapType,
          conversationHistory,
          sessionId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      // Add AI response
      const aiMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message to AI:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle chat minimization
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    
    // If the chat is being un-minimized, focus the input
    if (isMinimized && chatInputRef.current) {
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 300);
    }
  };

  // Handle text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  // Handle key press in the input field
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Clear the chat history
  const clearChat = () => {
    const welcomeMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: 'Chat history cleared. How can I help you explore this location?',
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
    localStorage.removeItem(CHAT_HISTORY_KEY);
    localStorage.removeItem('chat_session_id');
  };

  // Colors based on theme
  const colors = {
    bg: isDarkMode ? 'rgba(24, 24, 27, 0.9)' : 'rgba(255, 255, 255, 0.9)',
    text: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
    textSecondary: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
    border: isDarkMode ? 'rgba(63, 63, 70, 0.4)' : 'rgba(229, 231, 235, 0.8)',
    headerBg: isDarkMode ? 'rgba(44, 46, 102, 0.95)' : 'rgba(39, 76, 155, 0.95)',
    inputBg: isDarkMode ? 'rgba(39, 39, 42, 0.7)' : 'rgba(255, 255, 255, 0.7)',
    inputBorder: isDarkMode ? 'rgba(63, 63, 70, 0.5)' : 'rgba(0, 0, 0, 0.1)',
    primary: isDarkMode ? 'rgba(59, 73, 174, 1)' : 'rgba(37, 99, 235, 1)',
    userMessageBg: isDarkMode ? 'rgba(59, 73, 174, 0.9)' : 'rgba(37, 99, 235, 0.9)',
    assistantMessageBg: isDarkMode ? 'rgba(39, 39, 42, 0.6)' : 'rgba(243, 244, 246, 0.8)'
  };

  return (
    <div 
      ref={chatWindowRef}
      className={`absolute ${!wasDragged ? positionClassName : ''}`}
      style={{
        transform: wasDragged ? `translate(${position.x}px, ${position.y}px)` : '',
        cursor: isDragging ? 'grabbing' : 'default',
        zIndex: 1000,
        width: initialWidth + 'px',
        maxWidth: '90vw'
      }}
    >
      <div
        className="chat-window"
        style={{
          width: '100%',
          height: isMinimized ? 'auto' : `${initialHeight}px`,
          maxHeight: '80vh',
          borderRadius: '4px',
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
          backgroundColor: colors.bg,
          border: `1px solid ${colors.border}`,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Chat Header */}
        <div 
          className="chat-header"
          style={{
            padding: '10px 16px',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: colors.headerBg,
            color: 'white',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none'
          }}
          onMouseDown={handleMouseDown}
          title="Drag to move"
        >
          <div className="flex items-center gap-2">
            <span style={{ fontWeight: '600', fontSize: '14px' }}>EarthAI Assistant</span>
            <span className="text-xs opacity-70">Drag</span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button 
              onClick={clearChat}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '12px',
                padding: '4px 8px',
                borderRadius: '2px'
              }}
              title="Clear chat history"
            >
              Clear
            </button>
            <button 
              onClick={toggleMinimize}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '12px',
                padding: '4px 8px',
                borderRadius: '2px'
              }}
            >
              {isMinimized ? 'Expand' : 'Minimize'}
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <AnimatePresence>
          {!isMinimized && (
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                color: colors.text,
                backgroundColor: colors.bg
              }}
              className="messages-container"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%'
                  }}
                >
                  <div
                    className={message.role === 'user' ? 'user-message' : 'assistant-message'}
                    style={{
                      backgroundColor: message.role === 'user' ? colors.userMessageBg : colors.assistantMessageBg,
                      color: message.role === 'user' ? 'white' : colors.text,
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: `1px solid ${message.role === 'user' ? 'transparent' : colors.border}`,
                      wordBreak: 'break-word',
                      fontSize: '13px',
                      lineHeight: '1.4'
                    }}
                  >
                    {message.role === 'user' ? (
                      message.content
                    ) : (
                      renderMessageWithLinks(message.content, onNavigate)
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: '10px',
                      marginTop: '2px',
                      color: colors.textSecondary,
                      alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                      paddingLeft: message.role === 'user' ? '0' : '4px',
                      paddingRight: message.role === 'user' ? '4px' : '0'
                    }}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div
                  style={{
                    alignSelf: 'flex-start',
                    backgroundColor: colors.assistantMessageBg,
                    color: colors.text,
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: `1px solid ${colors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <div className="typing-dot" style={{ animationDelay: '0s' }}>•</div>
                    <div className="typing-dot" style={{ animationDelay: '0.2s' }}>•</div>
                    <div className="typing-dot" style={{ animationDelay: '0.4s' }}>•</div>
                  </div>
                  <div>Thinking...</div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </AnimatePresence>

        {/* Chat Input */}
        <AnimatePresence>
          {!isMinimized && (
            <div
              style={{
                borderTop: `1px solid ${colors.border}`,
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: colors.bg
              }}
            >
              <input
                type="text"
                ref={chatInputRef}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: '2px',
                  border: `1px solid ${colors.inputBorder}`,
                  outline: 'none',
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  fontSize: '13px'
                }}
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
              />
              <button
                style={{
                  backgroundColor: colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '2px',
                  padding: '0 12px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  opacity: isLoading || !input.trim() ? 0.5 : 1,
                  cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer'
                }}
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
              >
                Send
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChatWindow; 