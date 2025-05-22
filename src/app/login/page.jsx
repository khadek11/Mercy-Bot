'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock, Sun, Moon, Flame } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const router = useRouter();

  // Load preferred theme from localStorage if available
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    }
  }, []);

  // Update localStorage when theme changes
  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Check if we're already logged in
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return; // No token, stay on login page
        
        // Check if token is valid
        const res = await fetch('/api/auth/check', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (res.ok) {
          // If we're already logged in, redirect to home
          router.push('/');
        } else {
          // Invalid token, remove it
          localStorage.removeItem('authToken');
        }
      } catch (error) {
        // Ignore errors, just stay on login page
        console.log('Not logged in yet');
        localStorage.removeItem('authToken'); // Clear any invalid token
      }
    };
    
    checkLoginStatus();
  }, [router]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setMessage('');
  setIsLoggingIn(true);

  try {
    // Use the token-login endpoint
    const res = await fetch('/api/auth/token-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage('Login successful! Redirecting...');
      
      // Store the token in localStorage
      localStorage.setItem('authToken', data.token);
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/');
      }, 300);
    } else {
      setIsLoggingIn(false);
      setMessage(data.message || 'Login failed.');
    }
  } catch (error) {
    setIsLoggingIn(false);
    console.error('Login error:', error);
    setMessage('An error occurred during login.');
  }
};

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen py-2 transition-colors duration-200 ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`fixed top-0 w-full ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b shadow-sm p-4`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Flame className="text-red-500 mr-2" size={24} />
            <h1 className="text-xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">MERCY BOT</h1>
          </div>
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 w-full max-w-md px-4">
        <div className={`text-center mb-8 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Sign in to your account to continue</p>
        </div>

        <form 
          onSubmit={handleSubmit} 
          className={`w-full rounded-xl shadow-lg overflow-hidden ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border`}
        >
          <div className="p-8">
            <div className="mb-6">
              <label htmlFor="email" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Email Address
              </label>
              <div className={`flex items-center rounded-lg overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'} border focus-within:ring-2 focus-within:ring-red-500`}>
                <div className={`pl-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`w-full py-3 px-3 outline-none ${darkMode ? 'bg-gray-800 text-white placeholder-gray-500' : 'bg-gray-100 text-gray-900 placeholder-gray-400'}`}
                  placeholder="example@email.com"
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Password
              </label>
              <div className={`flex items-center rounded-lg overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'} border focus-within:ring-2 focus-within:ring-red-500`}>
                <div className={`pl-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`w-full py-3 px-3 outline-none ${darkMode ? 'bg-gray-800 text-white placeholder-gray-500' : 'bg-gray-100 text-gray-900 placeholder-gray-400'}`}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg flex justify-center items-center transition-colors duration-300"
            >
              <LogIn size={20} className="mr-2" />
              {isLoggingIn ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
          
          {message && (
            <div className={`px-8 pb-6 ${message.includes('successful') ? 'text-green-500' : 'text-red-500'}`}>
              <p>{message}</p>
            </div>
          )}
        </form>
        
        <p className={`text-center mt-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Don't have an account? <a href="/register" className="text-gradient bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent font-medium hover:opacity-90">Register here</a>
        </p>
      </div>
    </div>
  );
}