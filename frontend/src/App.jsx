import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import WelcomeScreen from './screens/WelcomeScreen';
import UploadScreen from './screens/UploadScreen';
import LoadingScreen from './screens/LoadingScreen';
import StartupLoading from './screens/StartupLoading';
import CompletionScreen from './screens/CompletionScreen';
import SettingsModal from './components/SettingsModal';
import { api } from './services/api';
import { Settings, CheckCircle } from 'lucide-react';

function App() {
  const [currentScreen, setCurrentScreen] = useState('STARTUP');
  const [userData, setUserData] = useState({ name: "Técnico" });
  const [sessionData, setSessionData] = useState({ sector: '', tests: [], files: [] });
  const [reportPath, setReportPath] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    // Attempt to load proper user info from backend
    const fetchUser = async () => {
      try {
        const info = await api.getUserInfo();
        if (info && info.name) {
          setUserData({ name: info.name, picture: info.picture });
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

  const steps = [
    { id: 'WELCOME', label: 'Seleção' },
    { id: 'UPLOAD', label: 'Upload' },
    { id: 'LOADING', label: 'Processando' },
    { id: 'COMPLETION', label: 'Resultado' }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentScreen);

  return (
    <div className="min-h-screen w-full bg-apple-bg flex items-center justify-center font-sans antialiased text-apple-text overflow-x-hidden transition-colors duration-500">
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      {/* Settings Button */}
      {currentScreen !== 'STARTUP' && (
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="fixed top-4 right-4 md:top-6 md:right-6 z-50 p-2.5 md:p-3 rounded-full bg-apple-white shadow-apple hover:shadow-apple-hover transition-all duration-300 group cursor-pointer border border-apple-gray dark:border-white/10"
          aria-label="Configurações"
        >
          <Settings size={18} className="text-apple-blue md:w-5 md:h-5 group-hover:rotate-180 transition-transform duration-700 ease-in-out" />
        </button>
      )}

      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-apple-blue/10 blur-[120px] rounded-full opacity-50" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-apple-blue/10 blur-[120px] rounded-full opacity-50" />
      </div>

      <main className="relative z-10 w-full max-w-7xl mx-auto py-12 flex flex-col min-h-screen pt-20">
        
        {/* Stepper Progress Indicator */}
        {currentScreen !== 'STARTUP' && (
          <div className="w-full max-w-3xl mx-auto mb-12 px-4">
            <div className="flex items-center justify-between relative">
              {/* Line connecting the steps */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-apple-gray rounded-full -z-10" />
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-apple-blue rounded-full transition-all duration-700 ease-in-out -z-10" 
                style={{ width: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%` }}
              />

              {steps.map((step, index) => {
                const isActive = index === currentStepIndex;
                const isCompleted = index < currentStepIndex;

                return (
                  <div key={step.id} className="flex flex-col items-center relative z-10">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 shadow-sm
                        ${isActive ? 'bg-apple-blue text-white scale-110 shadow-apple-blue/30 ring-4 ring-apple-blue/20' : 
                          isCompleted ? 'bg-apple-blue text-white' : 'bg-white text-apple-secondary border-2 border-apple-gray'}
                      `}
                    >
                      {isCompleted ? <CheckCircle size={18} /> : (index + 1)}
                    </div>
                    <span 
                      className={`absolute top-12 text-[10px] md:text-xs font-semibold whitespace-nowrap transition-colors duration-300
                        ${isActive ? 'text-apple-text' : isCompleted ? 'text-apple-blue' : 'text-apple-secondary'}
                      `}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex-1 w-full relative">
          <AnimatePresence mode="wait">
          {currentScreen === 'STARTUP' && (
            <StartupLoading 
              key="startup" 
              onFinish={() => setCurrentScreen('WELCOME')} 
            />
          )}

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
              sessionData={sessionData}
              onNext={handleNextFromUpload} 
              onBack={() => setCurrentScreen('WELCOME')} 
            />
          )}

          {currentScreen === 'LOADING' && (
            <LoadingScreen 
              key="loading" 
              sessionData={sessionData}
              onComplete={handleProcessComplete} 
              onBack={() => setCurrentScreen('UPLOAD')}
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
        </div>
      </main>
    </div>
  );
}

export default App;
