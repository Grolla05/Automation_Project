import { useState, useEffect, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Settings, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SettingsModal from './SettingsModal';
import StartupLoading from '../screens/StartupLoading';
import ErrorBoundary from './ErrorBoundary';
import { useWizardStore } from '../hooks/useWizardStore';
import { api } from '../services/api';

// ─── Component ────────────────────────────────────────────────────────────────

const RootLayout = () => {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const [isStarting, setIsStarting] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const STEPS = [
    { path: '/welcome',   label: t('stepper.selection')    },
    { path: '/upload',  label: t('stepper.upload')       },
    { path: '/process', label: t('stepper.processing') },
    { path: '/result',  label: t('stepper.result')      },
  ] as const;

  const { setUserData } = useWizardStore();
  const currentStepIndex = STEPS.findIndex((s) => s.path === pathname);
  const showStepper = !isStarting && currentStepIndex >= 0;

  // Fetch user info from backend once on mount
  useEffect(() => {
    api.getUserInfo()
      .then((info) => { if (info?.name) setUserData(info); })
      .catch((err) => console.warn('Could not fetch user info', err));
  }, [setUserData]);

  const handleStartupFinish = () => setIsStarting(false);

  return (
    <div className="min-h-screen w-full bg-apple-bg flex items-center justify-center font-sans antialiased text-apple-text overflow-x-hidden transition-colors duration-500">

      {/* Startup splash — shown on top of everything until dismissed */}
      <AnimatePresence>
        {isStarting && (
          <StartupLoading key="startup" onFinish={handleStartupFinish} />
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Settings Button */}
      {!isStarting && (
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="fixed top-4 right-4 md:top-6 md:right-6 z-50 p-2.5 md:p-3 rounded-full bg-apple-white shadow-apple hover:shadow-apple-hover transition-all duration-300 group cursor-pointer border border-apple-gray dark:border-white/10"
          aria-label={t('settings.title')}
        >
          <Settings
            size={18}
            className="text-apple-blue md:w-5 md:h-5 group-hover:rotate-180 transition-transform duration-700 ease-in-out"
          />
        </button>
      )}

      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-apple-blue/10 blur-[120px] rounded-full opacity-50" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-apple-blue/10 blur-[120px] rounded-full opacity-50" />
      </div>

      <main className="relative z-10 w-full max-w-7xl mx-auto py-12 flex flex-col min-h-screen pt-20">

        {/* Stepper Progress Indicator */}
        {showStepper && (
          <div className="w-full max-w-3xl mx-auto mb-12 px-4">
            <div className="flex items-center justify-between relative">
              {/* Background line */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-apple-gray rounded-full -z-10" />
              {/* Progress line */}
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-apple-blue rounded-full transition-all duration-700 ease-in-out -z-10"
                style={{
                  width: `${(Math.max(0, currentStepIndex) / (STEPS.length - 1)) * 100}%`,
                }}
              />

              {STEPS.map((step, index) => {
                const isActive = index === currentStepIndex;
                const isCompleted = index < currentStepIndex;

                return (
                  <div key={step.path} className="flex flex-col items-center relative z-10">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 shadow-sm
                        ${isActive
                          ? 'bg-apple-blue text-white scale-110 ring-4 ring-apple-blue/20'
                          : isCompleted
                            ? 'bg-apple-blue text-white'
                            : 'bg-white text-apple-secondary border-2 border-apple-gray'
                        }`}
                    >
                      {isCompleted ? <CheckCircle size={18} /> : index + 1}
                    </div>
                    <span
                      className={`absolute top-12 text-[10px] md:text-xs font-semibold whitespace-nowrap transition-colors duration-300
                        ${isActive ? 'text-apple-text' : isCompleted ? 'text-apple-blue' : 'text-apple-secondary'}`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Route content — only mount after startup splash finishes */}
        <div className="flex-1 w-full relative">
          <ErrorBoundary>
            {!isStarting && (
              <AnimatePresence mode="wait">
                <Suspense fallback={<div className="w-full flex justify-center py-20 animate-pulse text-apple-secondary">{t('common.loading')}</div>}>
                  <Outlet />
                </Suspense>
              </AnimatePresence>
            )}
          </ErrorBoundary>
        </div>
      </main>

    </div>
  );
};

export default RootLayout;
