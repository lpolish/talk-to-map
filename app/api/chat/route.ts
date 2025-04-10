import { NextRequest, NextResponse } from 'next/server';
import { formatPlaceLink } from '../../../utils/messageParser';
import { v4 as uuidv4 } from 'uuid';

// Landmark information (simulated database)
const landmarks = [
  {
    name: "Central Park",
    keywords: ["park", "nature", "green", "walk", "central park"],
    description: "A large urban park in Manhattan, New York City. It's a popular destination for tourists and locals.",
    coordinates: { lat: 40.7812, lng: -73.9665 },
    zoom: 14
  },
  {
    name: "Empire State Building",
    keywords: ["building", "tall", "skyscraper", "empire", "landmark"],
    description: "A 102-story skyscraper in Midtown Manhattan. It was the world's tallest building for nearly 40 years.",
    coordinates: { lat: 40.7484, lng: -73.9857 },
    zoom: 18
  },
  {
    name: "Statue of Liberty",
    keywords: ["statue", "liberty", "island", "monument"],
    description: "A colossal neoclassical sculpture on Liberty Island in New York Harbor.",
    coordinates: { lat: 40.6892, lng: -74.0445 },
    zoom: 16
  },
  {
    name: "Times Square",
    keywords: ["times", "square", "broadway", "theater", "shopping"],
    description: "A major commercial intersection, tourist destination, entertainment center, and neighborhood in Midtown Manhattan.",
    coordinates: { lat: 40.7580, lng: -73.9855 },
    zoom: 17
  }
];

export async function POST(request: NextRequest) {
  try {
    const { message, location, coordinates, zoom, conversationHistory, sessionId = uuidv4() } = await request.json();
    
    // Create a structured conversation history for the AI
    const formattedHistory = conversationHistory.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
    
    // Provide context about the current map view
    const systemMessage = {
      role: 'system',
      content: `You are EarthAI, an assistant that helps users explore geographic locations. 
      The user is currently viewing ${location || 'an unknown location'} at coordinates [${coordinates?.lat || 0}, ${coordinates?.lng || 0}] 
      with a zoom level of ${zoom || 0}. Provide helpful information about this location when asked.
      If the user asks for directions or about specific places, you can suggest they navigate to those coordinates.
      When referring to locations, you can create clickable links using the format [Place Name](nav:lat,lng,zoom).`
    };
    
    // Add the user's new message to the conversation
    const currentUserMessage = {
      role: 'user',
      content: message
    };
    
    // Construct the complete conversation with system message, history, and current message
    const completeConversation = [
      systemMessage,
      ...formattedHistory,
      currentUserMessage
    ];
    
    let aiResponse: string;
    
    try {
      // Try to use the OpenAI API if configured
      if (process.env.OPENAI_API_KEY) {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: completeConversation,
            temperature: 0.7,
            max_tokens: 500
          })
        });
        
        if (openaiResponse.ok) {
          const data = await openaiResponse.json();
          aiResponse = data.choices[0].message.content;
        } else {
          throw new Error('OpenAI API call failed');
        }
      } else {
        // Fallback: Use a local model or serverless function
        aiResponse = `I'm sorry, I couldn't process your request about "${message}" at ${location}. The AI service isn't currently configured. Please check with the administrator to set up the OpenAI API key.`;
      }
    } catch (aiError) {
      console.error('AI service error:', aiError);
      aiResponse = `I'm having trouble connecting to my knowledge services right now. Could you try again in a moment?`;
    }
    
    // Process the response to handle navigation links
    const processedResponse = aiResponse.replace(
      /\[([^\]]+)\]\(nav:(-?\d+\.?\d*),(-?\d+\.?\d*),(\d+)\)/g,
      (_unused: string, name: string, lat: string, lng: string, zoomLevel: string) => 
        formatPlaceLink(name, { lat: parseFloat(lat), lng: parseFloat(lng) }, parseInt(zoomLevel))
    );
    
    // Set the session cookie if it doesn't exist
    const headers = new Headers();
    if (!request.cookies.has('session_id')) {
      headers.append('Set-Cookie', `session_id=${sessionId}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${60 * 60 * 24 * 30}`);
    }
    
    return NextResponse.json(
      { message: processedResponse, sessionId },
      { status: 200, headers }
    );
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}

// A simulated response generator
async function generateSimulatedResponse(
  message: string,
  location: string,
  coordinates: { lat: number; lng: number } | undefined,
  zoom: number | undefined,
  history: { role: string; content: string }[]
): Promise<string> {
  // Simple keyword-based response generation
  const lowercaseMessage = message.toLowerCase();
  const zoomLevel = zoom || 13;
  
  // Wait a short time to simulate AI processing
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (!coordinates) {
    return "I can't determine your current location. Could you navigate to a specific area on the map?";
  }
  
  // Extract all previous user messages
  const userMessages = history.filter(msg => msg.role === 'user');
  console.log("User messages history:", JSON.stringify(userMessages));
  
  // Check for questions about the app's authenticity
  if (lowercaseMessage.includes("mock") || 
      lowercaseMessage.includes("real") || 
      (lowercaseMessage.includes("is this") && lowercaseMessage.includes("application"))) {
    return "I'm a real AI assistant designed to help you explore geographic locations. While I'm a demo version with simulated responses rather than a full production AI, I do remember our conversation history and can help you navigate the map. What would you like to explore today?";
  }
  
  // Check if this is a repeat question
  const isRepeatQuestion = userMessages.length > 1 && 
    userMessages.slice(0, -1).some(msg => 
      msg.content.toLowerCase().includes(message.toLowerCase()) ||
      message.toLowerCase().includes(msg.content.toLowerCase())
    );
  
  if (isRepeatQuestion) {
    return `I notice you've asked about this before. Let me elaborate further about ${message}. What specific details are you looking for?`;
  }
  
  // Memory-related questions
  if (lowercaseMessage.includes("remember") || 
      lowercaseMessage.includes("previous") || 
      lowercaseMessage.includes("last time") ||
      lowercaseMessage.includes("not reading") ||
      lowercaseMessage.includes("memory") ||
      lowercaseMessage.includes("context") ||
      lowercaseMessage.includes("conversation")) {
    
    if (userMessages.length <= 1) {
      return "I don't have any previous messages from you yet. This is our first conversation. How can I help you explore this location?";
    } else {
      // List previous messages to demonstrate memory
      let response = "Yes, I remember our conversation. Here's what we've discussed so far:\n\n";
      
      // Show up to 3 previous messages
      const previousMessages = userMessages.slice(-4, -1);
      previousMessages.forEach((msg, index) => {
        response += `${index + 1}. You asked: "${msg.content}"\n`;
      });
      
      response += "\nHow can I help you further with exploring this location?";
      return response;
    }
  }
  
  // Check for greeting
  if (lowercaseMessage.match(/^(hi|hello|hey|greetings)/)) {
    if (userMessages.length > 1) {
      return `Hello again! I see we've been chatting already. You're currently looking at ${location}. How can I continue to help you explore this area?`;
    } else {
      return `Hello! I'm your EarthAI assistant. You're currently looking at ${location}. How can I help you explore this area?`;
    }
  }
  
  // Check for frustration or shouting (all caps)
  if (message.toUpperCase() === message && message.length > 10) {
    return `I understand you might be frustrated. I am reading all your messages and maintaining our conversation context. Your current location is ${location}. How can I help you better explore this area?`;
  }
  
  // Check for location questions
  if (lowercaseMessage.includes("where am i") || lowercaseMessage.includes("current location")) {
    return `You're currently looking at ${location}. The coordinates are [${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}].`;
  }
  
  // Check for landmark inquiries
  for (const landmark of landmarks) {
    if (landmark.keywords.some((keyword: string) => lowercaseMessage.includes(keyword))) {
      const linkText = formatPlaceLink(landmark.name, landmark.coordinates, landmark.zoom);
      return `${landmark.description} You can view it here: ${linkText}`;
    }
  }
  
  // Check for nearby places
  if (lowercaseMessage.includes("nearby") || lowercaseMessage.includes("around me") || lowercaseMessage.includes("close by")) {
    // In a real app, we would query a places API with the coordinates
    const response = `Here are some places near ${location}:\n\n`;
    
    // Calculate distance from current view to landmarks and sort by distance
    const nearbyPlaces = landmarks
      .map(landmark => {
        const distance = Math.sqrt(
          Math.pow(landmark.coordinates.lat - coordinates.lat, 2) + 
          Math.pow(landmark.coordinates.lng - coordinates.lng, 2)
        );
        return { ...landmark, distance };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
    
    if (nearbyPlaces.length === 0) {
      return `I couldn't find any notable places near ${location}. Try zooming out or exploring a different area.`;
    }
    
    return nearbyPlaces.reduce((msg, place, i) => {
      const linkText = formatPlaceLink(place.name, place.coordinates, place.zoom);
      return `${msg}${i + 1}. ${linkText}: ${place.description}\n\n`;
    }, response);
  }
  
  // Default response that acknowledges the user's message
  return `I'm analyzing the area around ${location}. I've taken note of your message: "${message}". What else would you like to know about this location?`;
} 