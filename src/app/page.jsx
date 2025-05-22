"use client";
import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  Send,
  Mic,
  PlusCircle,
  Sun,
  Moon,
  Paperclip,
  Globe,
  Volume2,
  Menu,
  X,
  Wifi,
  WifiOff,
  Users, Calendar, Handshake, AlertCircle, LogOut, FileText, Trash2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useRouter } from 'next/navigation';

function App() {
  const [messages, setMessages] = useState([
    { id: 1, role: 'ai', content: 'Welcome to MercyBot\nI\'m here to support you with expert guidance on club management, team collaboration, and emergency response. How can I assist you today?' },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chats, setChats] = useState([
    { id: '1', name: 'Current Chat' },
  ]);
  const [activeChat, setActiveChat] = useState('1');
  const [isMobile, setIsMobile] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const fileInputRef = useRef(null);
  const [pdfText, setPdfText] = useState(null);
  const [pdfFileName, setPdfFileName] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const router = useRouter();

  const presetQuestions = [
    {
      id: 'q1',
      question: 'How do I efficiently manage club memberships?',
      icon: <Users size={20} />
    },
    {
      id: 'q2',
      question: 'What are the key steps in organizing a club event?',
      icon: <Calendar size={20} />
    },
    {
      id: 'q3',
      question: 'How can I resolve conflicts between team members?',
      icon: <Handshake size={20} />
    },
    {
      id: 'q4',
      question: 'What should I do in case of an emergency during an event?',
      icon: <AlertCircle size={20} />
    }
  ];

  useEffect(() => {
    const fetchInitialChat = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/chat`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('authToken'); // Clear invalid token
            router.push('/login');
            return;
          }
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        
        const fetchedChats = result.map((chat) => {
          // Get the first user message to use as chat name
          const firstUserMessage = chat.messages?.find(msg => msg.role === 'user' && msg.text);
          let chatName = 'New Chat';
          
          if (firstUserMessage) {
            // Use first 30 characters of the first message, remove line breaks
            chatName = firstUserMessage.text
              .replace(/\n/g, ' ')
              .trim()
              .substring(0, 40) + (firstUserMessage.text.length > 40 ? '...' : '');
          } else {
            // Fallback to date-based name
            const date = new Date(chat.createdAt || Date.now());
            chatName = `Chat ${date.toLocaleDateString()}`;
          }
          
          return {
            id: chat.chatId.toString(),
            name: chatName
          };
        });
        
        const currentChatExists = fetchedChats.some(chat => chat.id === '1');
        
        setChats(currentChatExists ? 
          fetchedChats : 
          [{ id: '1', name: 'Current Chat' }, ...fetchedChats]
        );
      } catch (error) {
        console.error("Error fetching chats:", error);
      }
    };

    fetchInitialChat();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
  ];

  const toggleTheme = () => setDarkMode(!darkMode);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleOnlineMode = () => setIsOnline(!isOnline);

  const handleSendMessage = async (text = inputMessage) => {
    if (!text.trim() && !pdfText) return;

    // If there's no text but there's a PDF, use a default message
    const messageText = text.trim() || (pdfText ? "Please analyze this PDF document." : "");
    
    const newUserMessage = {
      id: Date.now(),
      role: 'user',
      content: messageText + (pdfText ? `\n\n[Attached PDF Content]\n${pdfText}` : '')
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputMessage('');
    setPdfText(null);
    setPdfFileName(null);  // Clear the filename too
    setShowSuggestions(false);

    try {
      const requestBody = {
        chatId: activeChat,
        question: messageText,  // Use messageText instead of text
        language: selectedLanguage,
        pdfText: pdfText  // Changed from pdfContent to pdfText to match backend
      };
      
      console.log('Sending chat request:', requestBody); // Debug log
      
      const token = localStorage.getItem('authToken');
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
         if (response.status === 401) {
           localStorage.removeItem('authToken'); // Clear invalid token
           router.push('/login');
           return;
         }
         
         // Get more detailed error information
         let errorMessage = `HTTP error! status: ${response.status}`;
         try {
           const errorData = await response.json();
           errorMessage = errorData.error || errorMessage;
         } catch (e) {
           // If we can't parse the error response, use the default message
         }
         
         throw new Error(errorMessage);
      }

      const result = await response.json();

      const aiResponse = {
        id: Date.now() + 1,
        role: 'ai',
        content: result.text
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error in chat:", error);
      alert("Failed to send message. Please try again.");
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      console.log("Selected PDF file:", file);
      setIsProcessing(true);
      
      try {
        const formData = new FormData();
        formData.append('pdfFile', file);
        
        const response = await fetch('/api/upload-pdf', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || `HTTP error! Status: ${response.status}`);
        }
        
        const result = await response.json();
        setPdfText(result.text);
        setPdfFileName(file.name);  // Store the filename
        console.log("Extracted PDF text:", result.text);
        
      } catch (error) {
        console.error("Error processing PDF:", error);
        setPdfText(null);
        setPdfFileName(null);  // Clear filename on error
        alert("Failed to process PDF file: " + error.message);
      } finally {
        setIsProcessing(false);
      }
    } else {
      setPdfText(null);
      setPdfFileName(null);  // Clear filename if no PDF
      if (file) {
        alert("Please select a PDF file.");
      }
    }
    event.target.value = null;
  };

  const handleAttachClick = () => {
    if (!isProcessing) {
      fileInputRef.current.click();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = async () => {
    try {
      const newChatId = Date.now().toString();
      
      const token = localStorage.getItem('authToken');
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          chatId: newChatId,
          question: "New chat created",
          language: selectedLanguage
        }),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken'); // Clear invalid token
          router.push('/login');
          return;
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const newChat = { 
        id: newChatId, 
        name: `New Chat ${new Date().toLocaleDateString()}` 
      };
      setChats([newChat, ...chats]);
      setActiveChat(newChatId);
      
      setMessages([{ 
        id: Date.now(), 
        role: 'ai', 
        content: 'How can I help you today?' 
      }]);
      
      setShowSuggestions(true);
      setPdfText(null);
      setPdfFileName(null);  // Clear PDF state for new chat
      
      if (isMobile) setSidebarOpen(false);
    } catch (error) {
      console.error("Error creating new chat:", error);
      alert("Failed to create a new chat. Please try again.");
    }
  };

  const loadChatMessages = async (chatId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/chat/${chatId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          router.push('/login');
          return;
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const chatData = await response.json();
      
      setMessages(
        chatData.messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.text
        }))
      );
    } catch (error) {
      console.error("Error loading chat messages:", error);
      setMessages([{ 
        id: Date.now(), 
        role: 'ai', 
        content: 'Welcome back! How can I help you today?' 
      }]);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear the token from localStorage
      localStorage.removeItem('authToken');
      
      // Redirect to login
      router.push('/login');
    } catch (err) {
      console.error('An error occurred during logout', err);
      // Still redirect even if there's an error
      router.push('/login');
    }
  };

  const speakText = (text) => {
    if (!window.speechSynthesis) return;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedLanguage === 'hi' ? 'hi-IN' : 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const handleVoiceInput = () => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      alert("Your browser does not support speech recognition.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    const langMap = {
      en: "en-US",
      hi: "hi-IN",
      bn: "bn-BD",
      ta: "ta-IN",
      te: "te-IN",
      mr: "mr-IN",
      gu: "gu-IN",
      pa: "pa-IN",
      ml: "ml-IN",
      kn: "kn-IN",
      or: "or-IN",
      as: "as-IN",
    };

    recognition.lang = langMap[selectedLanguage] || "en-US";
    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };
  };

  const handlePresetQuestion = (question) => {
    handleSendMessage(question);
  };

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className={`flex items-center justify-between p-4 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b shadow-sm`}>
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className={`mr-3 p-2 rounded-full ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center">
            <Flame className="text-red-500 mr-2" size={24} />
            <h1 className="text-xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">MERCY BOT </h1>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleOnlineMode}
            className={`p-2 rounded-full ${isOnline
              ? (darkMode ? 'bg-green-800 hover:bg-green-700' : 'bg-green-200 hover:bg-green-300')
              : (darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-300 hover:bg-gray-400')
              }`}
            aria-label="Toggle online mode"
          >
            {isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
          </button>
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={handleLogout}
            className={`p-2 rounded-full ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
            aria-label="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="flex flex-grow overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}
            border-r w-72 flex flex-col transition-transform duration-300 ease-in-out
            ${isMobile ? 'absolute z-10 h-[calc(100%-64px)] mt-16' : 'relative'}`}
        >
          <div className="p-4">
            <button
              onClick={handleNewChat}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg
                ${darkMode ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700' : 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600'}
                text-white font-medium transition-colors`}
            >
              <PlusCircle size={18} />
              <span>New Chat</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            <h2 className={`px-4 py-2 text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Recent Chats</h2>
            <div className="space-y-1">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => {
                    setActiveChat(chat.id);
                    loadChatMessages(chat.id);
                    if (isMobile) setSidebarOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors
                    ${activeChat === chat.id
                      ? (darkMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-900')
                      : (darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100')}`}
                >
                  {chat.name}
                </button>
              ))}
            </div>
          </div>

          <div className={`p-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
            <div className="flex items-center">
              <Globe size={18} className="mr-2" />
              <select
                className={`w-full p-2 rounded-md ${darkMode
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-gray-100 border-gray-300 text-gray-900'
                  } border`}
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Connection Status Banner */}
          {!isOnline && (
            <div className={`${darkMode ? 'bg-yellow-900' : 'bg-yellow-100'} p-2 text-center`}>
              <p className={`text-sm ${darkMode ? 'text-yellow-200' : 'text-yellow-800'} flex items-center justify-center gap-2`}>
                <WifiOff size={16} />
                <span>You're in offline mode. Some features may be limited.</span>
              </p>
            </div>
          )}

          {/* Messages */}
          <div className={`flex-1 max-h-[80vh] overflow-y-auto p-4 ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
            <div className="max-w-6xl mx-auto space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                      ? darkMode
                        ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white'
                        : 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                      : darkMode
                        ? 'bg-gray-900 text-white border border-gray-800'
                        : 'bg-white text-gray-900 shadow-sm'
                      }`}
                  >
                    <ReactMarkdown className="whitespace-pre-wrap">{message.content}</ReactMarkdown>
                    {message.role === 'ai' && (
                      <button
                        onClick={() => speakText(message.content)}
                        className={`mt-2 p-1 rounded ${darkMode
                          ? 'bg-gray-800 hover:bg-gray-700'
                          : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                        aria-label="Speak text"
                      >
                        <Volume2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Preset Questions */}
              {showSuggestions && messages.length < 2 && (
                <div className="mt-6 space-y-4">
                  <h3 className={`text-center text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Suggested Questions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {presetQuestions.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => handlePresetQuestion(q.question)}
                        className={`flex items-center gap-2 p-3 rounded-lg text-left transition-all transform hover:scale-[1.02] ${darkMode
                          ? 'bg-gray-900 border border-gray-800 hover:border-red-500/50 text-white'
                          : 'bg-white border border-gray-200 hover:border-red-500/50 text-gray-900 shadow-sm'
                          }`}
                      >
                        <span className={`p-2 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                          {q.icon}
                        </span>
                        <span className="text-sm">{q.question}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className={`p-4 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-t`}>
            <div className="max-w-6xl mx-auto">
              {/* PDF Upload Indicator */}
              {pdfText && (
                <div className={`mb-3 flex items-center gap-2 p-3 rounded-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-blue-50 border border-blue-200'}`}>
                  <FileText size={20} className={`${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <span className={`flex-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    PDF Attached: {pdfFileName}
                  </span>
                  <button
                    onClick={() => {
                      setPdfText(null);
                      setPdfFileName(null);
                    }}
                    className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
                    aria-label="Remove PDF"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
              
              <div className={`flex items-center rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} p-1`}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf"
                />
                <button
                  className={`p-2 rounded-full ${isProcessing 
                    ? 'opacity-50 cursor-not-allowed' 
                    : (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200')}`}
                  aria-label="Attach file"
                  onClick={handleAttachClick}
                  disabled={isProcessing}
                >
                  <Paperclip size={20} />
                </button>
                <textarea
                  className={`flex-1 resize-none outline-none px-3 py-2 ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'}`}
                  placeholder="Ask about fire safety..."
                  rows={1}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                />
                <button
                  className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                  onClick={handleVoiceInput}
                  aria-label="Voice input"
                >
                  <Mic size={20} />
                </button>
                <button
                  className={`p-2 rounded-full ${inputMessage.trim() || pdfText
                    ? (darkMode ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700' : 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600')
                    : (darkMode ? 'bg-gray-700' : 'bg-gray-300')
                    } text-white`}
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() && !pdfText}
                  aria-label="Send message"
                >
                  <Send size={20} />
                </button>
              </div>
              
              {/* Status Messages */}
              {isProcessing && (
                <div className={`mt-2 text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  Processing PDF...
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;