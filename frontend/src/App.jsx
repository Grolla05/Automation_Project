import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import WelcomeScreen from './screens/WelcomeScreen';
import UploadScreen from './screens/UploadScreen';
import LoadingScreen from './screens/LoadingScreen';
import CompletionScreen from './screens/CompletionScreen';
import { api } from './services/api';
import { useTheme } from './hooks/useTheme';
import { Sun, Moon } from 'lucide-react';

function App() {
  const [currentScreen, setCurrentScreen] = useState('WELCOME');
  const [userData, setUserData] = useState({ name: "Engenheiro" });
  const [sessionData, setSessionData] = useState({ sector: '', tests: [], files: [] });
  const [reportPath, setReportPath] = useState(null);
  
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    // Attempt to load proper user info from backend
    const fetchUser = async () => {
      try {
        const info = await api.getUserInfo();
        if (info && info.name) {
          setUserData({ name: info.name });
        }
      } catch (err) {
        console.warn("Could not fetch user info", err);
      }
    };
    fetchUser();
  }, []);

  const handleNextFromWelcome = (data) => {
    setSessionData(prev => ({ ...prev, ...data }));
    setCurrentScreen('UPLOAD');
  };

  const handleNextFromUpload = (files) => {
    setSessionData(prev => ({ ...prev, files }));
    setCurrentScreen('LOADING');
  };

  const handleProcessComplete = (result) => {
    if (result && result.path) {
      setReportPath(result.path);
    }
    setCurrentScreen('COMPLETION');
  };

  const handleReset = () => {
    setSessionData({ sector: '', tests: [], files: [] });
    setReportPath(null);
    setCurrentScreen('WELCOME');
  };

  return (
    <div className="min-h-screen w-full bg-apple-bg flex items-center justify-center font-sans antialiased text-apple-text overflow-x-hidden transition-colors duration-500">
      {/* Theme Toggle Button */}
      <button 
        onClick={toggleTheme}
        className="fixed top-6 right-6 z-50 p-3 rounded-full bg-apple-white shadow-apple hover:shadow-apple-hover transition-all duration-300 group cursor-pointer border border-apple-gray"
        aria-label="Alternar Tema"
      >
        {theme === 'light' ? (
          <Moon size={20} className="text-apple-secondary group-hover:text-apple-text transition-colors" />
        ) : (
          <Sun size={20} className="text-apple-secondary group-hover:text-apple-text transition-colors" />
        )}
      </button>

      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-apple-blue/10 blur-[120px] rounded-full opacity-50 dark:opacity-30" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-apple-blue/10 blur-[120px] rounded-full opacity-50 dark:opacity-30" />
      </div>

      <main className="relative z-10 w-full max-w-7xl mx-auto py-12">
        <AnimatePresence mode="wait">
          {currentScreen === 'WELCOME' && (
            <WelcomeScreen 
              key="welcome" 
              userData={userData} 
              onNext={handleNextFromWelcome} 
            />
          )}

          {currentScreen === 'UPLOAD' && (
            <UploadScreen 
              key="upload" 
              onNext={handleNextFromUpload} 
              onBack={() => setCurrentScreen('WELCOME')} 
            />
          )}

          {currentScreen === 'LOADING' && (
            <LoadingScreen 
              key="loading" 
              sessionData={sessionData}
              onComplete={handleProcessComplete} 
            />
          )}

          {currentScreen === 'COMPLETION' && (
            <CompletionScreen 
              key="completion" 
              reportPath={reportPath}
              onReset={handleReset} 
            />
          )}
        </AnimatePresence>
      </main>

      {/* Footer Branding */}
      <footer className="fixed bottom-6 left-0 right-0 text-center pointer-events-none z-10">
        <p className="text-[10px] text-apple-secondary uppercase tracking-[0.2em] font-semibold opacity-50">
          OCR Document Generator • Powered by Engineering
        </p>
      </footer>
    </div>
  );
}

export default App;
