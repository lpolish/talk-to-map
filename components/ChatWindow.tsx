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
  initialX = 20,
  initialY = 20,
  initialWidth = 320,
  initialHeight = 480
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
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
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
    
    // Store the initial window position
    dragStartOffset.current = { ...position };
    
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
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // Handle key press in the input field
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
    bg: isDarkMode ? 'rgba(24, 24, 27, 0.85)' : 'rgba(255, 255, 255, 0.85)',
    text: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
    textSecondary: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
    border: isDarkMode ? 'rgba(63, 63, 70, 0.4)' : 'rgba(229, 231, 235, 0.8)',
    headerBg: isDarkMode ? 'rgba(49, 46, 129, 0.9)' : 'rgba(30, 64, 175, 0.9)',
    inputBg: isDarkMode ? 'rgba(39, 39, 42, 0.7)' : 'rgba(255, 255, 255, 0.7)',
    inputBorder: isDarkMode ? 'rgba(63, 63, 70, 0.5)' : 'rgba(0, 0, 0, 0.1)',
    primary: isDarkMode ? 'rgba(79, 70, 229, 0.9)' : 'rgba(37, 99, 235, 0.9)',
    userMessageBg: isDarkMode ? 'rgba(79, 70, 229, 0.8)' : 'rgba(37, 99, 235, 0.8)',
    assistantMessageBg: isDarkMode ? 'rgba(39, 39, 42, 0.6)' : 'rgba(243, 244, 246, 0.8)'
  };

  return (
    <div 
      ref={chatWindowRef}
      className="absolute"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'default',
        zIndex: 1000,
        width: initialWidth + 'px',
        maxWidth: '90vw'
      }}
    >
      <motion.div
        className="chat-window"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          width: '100%',
          height: isMinimized ? 'auto' : `${initialHeight}px`,
          maxHeight: '80vh',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: isDarkMode 
            ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
            : '0 8px 32px rgba(0, 0, 0, 0.15)',
          backgroundColor: colors.bg,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${colors.border}`,
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Chat Header */}
        <div 
          className="chat-header"
          style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: colors.headerBg,
            color: 'white',
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" strokeWidth="2"/>
              <path d="M15 9.5C15 11.9853 12 16 12 16C12 16 9 11.9853 9 9.5C9 7.01472 10.3431 5 12 5C13.6569 5 15 7.01472 15 9.5Z" stroke="white" strokeWidth="2"/>
              <path d="M12 10C12.5523 10 13 9.55228 13 9C13 8.44772 12.5523 8 12 8C11.4477 8 11 8.44772 11 9C11 9.55228 11.4477 10 12 10Z" fill="white"/>
            </svg>
            <span style={{ fontWeight: '600', fontSize: '14px' }}>EarthAI Assistant</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={clearChat}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '13px',
                padding: '4px 8px',
                opacity: 0.8,
                transition: 'opacity 0.2s'
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseOut={(e) => (e.currentTarget.style.opacity = '0.8')}
              title="Clear chat history"
            >
              🗑️
            </button>
            <button 
              onClick={toggleMinimize}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '4px 8px',
                opacity: 0.8,
                transition: 'opacity 0.2s'
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseOut={(e) => (e.currentTarget.style.opacity = '0.8')}
            >
              {isMinimized ? '▲' : '▼'}
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
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
                      padding: '10px 14px',
                      borderRadius: '14px',
                      backdropFilter: 'blur(8px)',
                      border: `1px solid ${message.role === 'user' ? 'transparent' : colors.border}`,
                      boxShadow: message.role === 'user' ? 'none' : `0 1px 3px ${isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)'}`,
                      wordBreak: 'break-word',
                      fontSize: '13px',
                      lineHeight: '1.5'
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
                      fontSize: '11px',
                      marginTop: '3px',
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
                    padding: '10px 14px',
                    borderRadius: '14px',
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${colors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Input */}
        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{
                borderTop: `1px solid ${colors.border}`,
                padding: '12px',
                display: 'flex',
                alignItems: 'flex-end',
                gap: '8px',
                backgroundColor: colors.bg
              }}
            >
              <textarea
                ref={chatInputRef}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: `1px solid ${colors.inputBorder}`,
                  resize: 'none',
                  minHeight: '38px',
                  maxHeight: '100px',
                  outline: 'none',
                  fontFamily: 'inherit',
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  fontSize: '13px',
                  lineHeight: '1.5',
                  transition: 'border 0.2s ease',
                  boxShadow: `0 1px 2px ${isDarkMode ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)'}`,
                }}
                placeholder="Type your message..."
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                rows={1}
              />
              <button
                style={{
                  backgroundColor: colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0 14px',
                  height: '38px',
                  cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '500',
                  fontSize: '13px',
                  transition: 'all 0.2s ease',
                  opacity: isLoading || !input.trim() ? 0.7 : 1,
                }}
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
              >
                Send
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ChatWindow; 