
/*import { useState, useEffect, useRef } from 'react';

// Type definitions
type Message = {
  id: string;
  sender: 'user' | 'contact' | 'ai';
  content: string;
  timestamp: string;
};

type Chat = {
  id: string;
  name: string;
  isAI: boolean;
  lastMessage: string;
  timestamp: string;
  messages: Message[];
};

// Mock data for initial chats
const initialChats: Chat[] = [
  { id: '1', name: 'John Doe', isAI: false, lastMessage: 'Hey, how are you?', timestamp: '2025-06-07 22:00', messages: [
    { id: 'm1', sender: 'contact', content: 'Hey, how are you?', timestamp: '2025-06-07 22:00' },
    { id: 'm2', sender: 'user', content: 'Good, thanks! You?', timestamp: '2025-06-07 22:01' }
  ]},
  { id: '2', name: 'AI Assistant', isAI: true, lastMessage: 'How can I help you today?', timestamp: '2025-06-07 22:05', messages: [
    { id: 'm3', sender: 'ai', content: 'How can I help you today?', timestamp: '2025-06-07 22:05' }
  ]}
];

// Fetch response from Gemini API
const fetchGeminiResponse = async (message: string, chatHistory: Message[], apiKey: string): Promise<string> => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            ...chatHistory
              .filter(msg => msg.sender !== 'contact') // Exclude contact messages for AI context
              .map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
              })),
            { role: 'user', parts: [{ text: message }] }
          ]
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Gemini API');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error(error);
    return 'Error: Could not connect to Gemini API. Check your API key or network.';
  }
};

const App: React.FC = () => {
  // State for chats, selected chat, search, message, API key, and loading
  const [chats, setChats] = useState<Chat[]>(() => {
    const saved = localStorage.getItem('chats');
    return saved ? JSON.parse(saved) : initialChats;
  });
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save chats to localStorage
  useEffect(() => {
    localStorage.setItem('chats', JSON.stringify(chats));
  }, [chats]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChatId, chats]);

  // Filter chats based on search
  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(search.toLowerCase())
  );

  // Handle chat selection
  const selectChat = (id: string) => {
    setSelectedChatId(id);
  };

  // Handle API key submission
  const handleApiKeySubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && apiKey.trim()) {
      // API key is stored in state, ready for use
    }
  };

  // Handle message submission
  const sendMessage = async (e: React.MouseEvent) => {
    if (!newMessage.trim() || !selectedChatId) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: newMessage.trim(),
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };

    setChats(prevChats => {
      const updatedChats = prevChats.map(chat => {
        if (chat.id === selectedChatId) {
          return {
            ...chat,
            messages: [...chat.messages, newMsg],
            lastMessage: newMsg.content,
            timestamp: newMsg.timestamp
          };
        }
        return chat;
      });
      return updatedChats;
    });

    // If chatting with AI, fetch response from Gemini
    const selectedChat = chats.find(chat => chat.id === selectedChatId);
    if (selectedChat?.isAI) {
      if (!apiKey.trim()) {
        const errorMsg: Message = {
          id: Date.now().toString() + '-error',
          sender: 'ai',
          content: 'Please enter your Gemini API key to chat with me.',
          timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
        };
        setChats(prevChats => {
          const updatedChats = prevChats.map(chat => {
            if (chat.id === selectedChatId) {
              return {
                ...chat,
                messages: [...chat.messages, errorMsg],
                lastMessage: errorMsg.content,
                timestamp: errorMsg.timestamp
              };
            }
            return chat;
          });
          return updatedChats;
        });
      } else {
        setIsLoading(true);
        const aiResponse = await fetchGeminiResponse(newMessage, selectedChat.messages, apiKey);
        const aiMsg: Message = {
          id: Date.now().toString() + '-ai',
          sender: 'ai',
          content: aiResponse,
          timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
        };
        setChats(prevChats => {
          const updatedChats = prevChats.map(chat => {
            if (chat.id === selectedChatId) {
              return {
                ...chat,
                messages: [...chat.messages, aiMsg],
                lastMessage: aiResponse,
                timestamp: aiMsg.timestamp
              };
            }
            return chat;
          });
          return updatedChats;
        });
        setIsLoading(false);
      }
    }

    setNewMessage('');
  };

  // Get selected chat
  const selectedChat = chats.find(chat => chat.id === selectedChatId);

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800">
      
      <div className="w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 bg-blue-600 text-white">
          <h1 className="text-xl font-bold">AI Messenger</h1>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="w-full mt-2 p-2 rounded bg-blue-500 text-white placeholder-white/70 focus:outline-none"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredChats.map(chat => (
            <div
              key={chat.id}
              onClick={() => selectChat(chat.id)}
              className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                selectedChatId === chat.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                  chat.isAI ? 'bg-green-500' : 'bg-blue-500'
                }`}>
                  {chat.isAI ? 'AI' : chat.name[0]}
                </div>
                <div className="ml-3">
                  <p className="font-semibold">{chat.name}</p>
                  <p className="text-sm text-gray-500">{chat.lastMessage}</p>
                  <p className="text-xs text-gray-400">{chat.timestamp}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            <div className="p-4 bg-white border-b border-gray-200 flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                selectedChat.isAI ? 'bg-green-500' : 'bg-blue-500'
              }`}>
                {selectedChat.isAI ? 'AI' : selectedChat.name[0]}
              </div>
              <h2 className="ml-3 text-lg font-semibold">{selectedChat.name}</h2>
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {selectedChat.isAI && !apiKey.trim() && (
                <div className="mb-4 p-4 bg-white rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-2">Enter Gemini API Key</h3>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    onKeyPress={handleApiKeySubmit}
                    placeholder="Paste your Gemini API key here"
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Get your key from <a href="https://makersuite.google.com/app/apikey" target="_blank" className="text-blue-500 hover:underline">Google AI Studio</a>. Press Enter to save.
                  </p>
                </div>
              )}
              {selectedChat.messages.map(msg => (
                <div
                  key={msg.id}
                  className={`mb-4 flex ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs md:max-w-md p-3 rounded-lg ${
                      msg.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : msg.sender === 'ai'
                        ? 'bg-green-100 text-gray-800'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{msg.timestamp}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="mb-4 flex justify-start">
                  <div className="max-w-xs md:max-w-md p-3 rounded-lg bg-green-100 text-gray-800">
                    <p className="italic">AI is typing...</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-white border-t border-gray-200 flex items-center">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 p-2 rounded-l bg-gray-100 focus:outline-none"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                className="p-2 bg-blue-600 text-white rounded-r hover:bg-blue-700 disabled:bg-gray-400"
                disabled={!newMessage.trim() || isLoading}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
};

export default App;*/



/*import { useState, useEffect, useRef } from 'react';

// Type definitions
type Message = {
  id: string;
  sender: 'user' | 'contact' | 'ai';
  content: string;
  timestamp: string;
};

type Chat = {
  id: string;
  name: string;
  isAI: boolean;
  lastMessage: string;
  timestamp: string;
  messages: Message[];
};

// Mock data for initial chats
const initialChats: Chat[] = [
  { id: '1', name: 'John Doe', isAI: false, lastMessage: 'Hey, how are you?', timestamp: '2025-06-07 22:00', messages: [
    { id: 'm1', sender: 'contact', content: 'Hey, how are you?', timestamp: '2025-06-07 22:00' },
    { id: 'm2', sender: 'user', content: 'Good, thanks! You?', timestamp: '2025-06-07 22:01' }
  ]},
  { id: '2', name: 'AI Assistant', isAI: true, lastMessage: 'How can I help you today?', timestamp: '2025-06-07 22:05', messages: [
    { id: 'm3', sender: 'ai', content: 'How can I help you today?', timestamp: '2025-06-07 22:05' }
  ]}
];

// Fetch response from Gemini API
const fetchGeminiResponse = async (message: string, chatHistory: Message[], apiKey: string): Promise<string> => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            ...chatHistory
              .filter(msg => msg.sender !== 'contact') // Exclude contact messages for AI context
              .map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
              })),
            { role: 'user', parts: [{ text: message }] }
          ]
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Gemini API');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error(error);
    return 'Error: Could not connect to Gemini API. Check your API key or network.';
  }
};

const App: React.FC = () => {
  // Get API key from environment variable (works for Vite or Create React App)
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY || '';

  // State for chats, selected chat, search, message, and loading
  const [chats, setChats] = useState<Chat[]>(() => {
    const saved = localStorage.getItem('chats');
    return saved ? JSON.parse(saved) : initialChats;
  });
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save chats to localStorage
  useEffect(() => {
    localStorage.setItem('chats', JSON.stringify(chats));
  }, [chats]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChatId, chats]);

  // Filter chats based on search
  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(search.toLowerCase())
  );

  // Handle chat selection
  const selectChat = (id: string) => {
    setSelectedChatId(id);
  };

  // Handle message submission
  const sendMessage = async (e: React.MouseEvent) => {
    if (!newMessage.trim() || !selectedChatId) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: newMessage.trim(),
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };

    setChats(prevChats => {
      const updatedChats = prevChats.map(chat => {
        if (chat.id === selectedChatId) {
          return {
            ...chat,
            messages: [...chat.messages, newMsg],
            lastMessage: newMsg.content,
            timestamp: newMsg.timestamp
          };
        }
        return chat;
      });
      return updatedChats;
    });

    // If chatting with AI, fetch response from Gemini
    const selectedChat = chats.find(chat => chat.id === selectedChatId);
    if (selectedChat?.isAI) {
      if (!apiKey) {
        const errorMsg: Message = {
          id: Date.now().toString() + '-error',
          sender: 'ai',
          content: 'Error: No Gemini API key found. Please set VITE_GEMINI_API_KEY or REACT_APP_GEMINI_API_KEY in your .env file.',
          timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
        };
        setChats(prevChats => {
          const updatedChats = prevChats.map(chat => {
            if (chat.id === selectedChatId) {
              return {
                ...chat,
                messages: [...chat.messages, errorMsg],
                lastMessage: errorMsg.content,
                timestamp: errorMsg.timestamp
              };
            }
            return chat;
          });
          return updatedChats;
        });
      } else {
        setIsLoading(true);
        const aiResponse = await fetchGeminiResponse(newMessage, selectedChat.messages, apiKey);
        const aiMsg: Message = {
          id: Date.now().toString() + '-ai',
          sender: 'ai',
          content: aiResponse,
          timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
        };
        setChats(prevChats => {
          const updatedChats = prevChats.map(chat => {
            if (chat.id === selectedChatId) {
              return {
                ...chat,
                messages: [...chat.messages, aiMsg],
                lastMessage: aiResponse,
                timestamp: aiMsg.timestamp
              };
            }
            return chat;
          });
          return updatedChats;
        });
        setIsLoading(false);
      }
    }

    setNewMessage('');
  };

  // Get selected chat
  const selectedChat = chats.find(chat => chat.id === selectedChatId);

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800">
 
      <div className="w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 bg-blue-600 text-white">
          <h1 className="text-xl font-bold">AI Messenger</h1>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="w-full mt-2 p-2 rounded bg-blue-500 text-white placeholder-white/70 focus:outline-none"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredChats.map(chat => (
            <div
              key={chat.id}
              onClick={() => selectChat(chat.id)}
              className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                selectedChatId === chat.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                  chat.isAI ? 'bg-green-500' : 'bg-blue-500'
                }`}>
                  {chat.isAI ? 'AI' : chat.name[0]}
                </div>
                <div className="ml-3">
                  <p className="font-semibold">{chat.name}</p>
                  <p className="text-sm text-gray-500">{chat.lastMessage}</p>
                  <p className="text-xs text-gray-400">{chat.timestamp}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            <div className="p-4 bg-white border-b border-gray-200 flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                selectedChat.isAI ? 'bg-green-500' : 'bg-blue-500'
              }`}>
                {selectedChat.isAI ? 'AI' : selectedChat.name[0]}
              </div>
              <h2 className="ml-3 text-lg font-semibold">{selectedChat.name}</h2>
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {selectedChat.messages.map(msg => (
                <div
                  key={msg.id}
                  className={`mb-4 flex ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs md:max-w-md p-3 rounded-lg ${
                      msg.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : msg.sender === 'ai'
                        ? 'bg-green-100 text-gray-800'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{msg.timestamp}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="mb-4 flex justify-start">
                  <div className="max-w-xs md:max-w-md p-3 rounded-lg bg-green-100 text-gray-800">
                    <p className="italic">AI is typing...</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-white border-t border-gray-200 flex items-center">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 p-2 rounded-l bg-gray-100 focus:outline-none"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                className="p-2 bg-blue-600 text-white rounded-r hover:bg-blue-700 disabled:bg-gray-400"
                disabled={!newMessage.trim() || isLoading}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
};

export default App;*/



import { useState, useEffect, useRef } from 'react';

// Type definitions
type Message = {
  id: string;
  sender: 'user' | 'contact' | 'ai';
  content: string;
  timestamp: string;
};

type Chat = {
  id: string;
  name: string;
  isAI: boolean;
  lastMessage: string;
  timestamp: string;
  messages: Message[];
};

// Mock data for initial chats
const initialChats: Chat[] = [
  { id: '1', name: 'John Doe', isAI: false, lastMessage: 'Hey, how are you?', timestamp: '2025-06-07 22:00', messages: [
    { id: 'm1', sender: 'contact', content: 'Hey, how are you?', timestamp: '2025-06-07 22:00' },
    { id: 'm2', sender: 'user', content: 'Good, thanks! You?', timestamp: '2025-06-07 22:01' }
  ]},
  { id: '2', name: 'AI Assistant', isAI: true, lastMessage: 'How can I help you today?', timestamp: '2025-06-07 22:05', messages: [
    { id: 'm3', sender: 'ai', content: 'How can I help you today?', timestamp: '2025-06-07 22:05' }
  ]}
];

// Fetch response from Gemini API
const fetchGeminiResponse = async (message: string, chatHistory: Message[], apiKey: string): Promise<string> => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            ...chatHistory
              .filter(msg => msg.sender !== 'contact')
              .map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
              })),
            { role: 'user', parts: [{ text: message }] }
          ]
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Gemini API');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error(error);
    return 'Error: Could not connect to Gemini API. Check your API key or network.';
  }
};

const App: React.FC = () => {
  // Get API key from environment variable
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY || '';

  // State for chats, selected chat, search, message, and loading
  const [chats, setChats] = useState<Chat[]>(() => {
    const saved = localStorage.getItem('chats');
    return saved ? JSON.parse(saved) : initialChats;
  });
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save chats to localStorage
  useEffect(() => {
    localStorage.setItem('chats', JSON.stringify(chats));
  }, [chats]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChatId, chats, isLoading]);

  // Filter chats based on search
  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(search.toLowerCase())
  );

  // Handle chat selection
  const selectChat = (id: string) => {
    setSelectedChatId(id);
  };

  // Handle message submission
  const sendMessage = async (e: React.MouseEvent) => {
    if (!newMessage.trim() || !selectedChatId) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: newMessage.trim(),
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };

    setChats(prevChats => {
      const updatedChats = prevChats.map(chat => {
        if (chat.id === selectedChatId) {
          return {
            ...chat,
            messages: [...chat.messages, newMsg],
            lastMessage: newMsg.content,
            timestamp: newMsg.timestamp
          };
        }
        return chat;
      });
      return updatedChats;
    });

    // If chatting with AI, fetch response from Gemini
    const selectedChat = chats.find(chat => chat.id === selectedChatId);
    if (selectedChat?.isAI) {
      if (!apiKey) {
        const errorMsg: Message = {
          id: Date.now().toString() + '-error',
          sender: 'ai',
          content: 'Error: No Gemini API key found. Please set VITE_GEMINI_API_KEY or REACT_APP_GEMINI_API_KEY in your .env file.',
          timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
        };
        setChats(prevChats => {
          const updatedChats = prevChats.map(chat => {
            if (chat.id === selectedChatId) {
              return {
                ...chat,
                messages: [...chat.messages, errorMsg],
                lastMessage: errorMsg.content,
                timestamp: errorMsg.timestamp
              };
            }
            return chat;
          });
          return updatedChats;
        });
      } else {
        setIsLoading(true);
        const aiResponse = await fetchGeminiResponse(newMessage, selectedChat.messages, apiKey);
        const aiMsg: Message = {
          id: Date.now().toString() + '-ai',
          sender: 'ai',
          content: aiResponse,
          timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
        };
        setChats(prevChats => {
          const updatedChats = prevChats.map(chat => {
            if (chat.id === selectedChatId) {
              return {
                ...chat,
                messages: [...chat.messages, aiMsg],
                lastMessage: aiResponse,
                timestamp: aiMsg.timestamp
              };
            }
            return chat;
          });
          return updatedChats;
        });
        setIsLoading(false);
      }
    }

    setNewMessage('');
  };

  // Get selected chat
  const selectedChat = chats.find(chat => chat.id === selectedChatId);

  return (
    <div className="w-screen h-screen flex bg-gray-100 text-gray-800">
      {/* Sidebar: Chat List */}
      <div className="w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 flex flex-col h-full">
        <div className="p-4 bg-blue-600 text-white">
          <h1 className="text-xl font-bold">AI Messenger</h1>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="w-full mt-2 p-2 rounded bg-blue-500 text-white placeholder-white/70 focus:outline-none"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredChats.map(chat => (
            <div
              key={chat.id}
              onClick={() => selectChat(chat.id)}
              className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                selectedChatId === chat.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                  chat.isAI ? 'bg-green-500' : 'bg-blue-500'
                }`}>
                  {chat.isAI ? 'AI' : chat.name[0]}
                </div>
                <div className="ml-3">
                  <p className="font-semibold">{chat.name}</p>
                  <p className="text-sm text-gray-500">{chat.lastMessage}</p>
                  <p className="text-xs text-gray-400">{chat.timestamp}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        {selectedChat ? (
          <>
            <div className="p-4 bg-white border-b border-gray-200 flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                selectedChat.isAI ? 'bg-green-500' : 'bg-blue-500'
              }`}>
                {selectedChat.isAI ? 'AI' : selectedChat.name[0]}
              </div>
              <h2 className="ml-3 text-lg font-semibold">{selectedChat.name}</h2>
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 w-full">
              {selectedChat.messages.map(msg => (
                <div
                  key={msg.id}
                  className={`mb-4 flex w-full ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs md:max-w-md p-3 rounded-lg ${
                      msg.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : msg.sender === 'ai'
                        ? 'bg-green-100 text-gray-800'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{msg.timestamp}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="mb-4 flex justify-start w-full">
                  <div className="max-w-xs md:max-w-md p-3 rounded-lg bg-green-100 text-gray-800">
                    <p className="italic">AI is typing...</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-white border-t border-gray-200 flex items-center w-full">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 p-2 rounded-l bg-gray-100 focus:outline-none"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                className="p-2 bg-blue-600 text-white rounded-r hover:bg-blue-700 disabled:bg-gray-400"
                disabled={!newMessage.trim() || isLoading}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 w-full h-full">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
};

export default App;