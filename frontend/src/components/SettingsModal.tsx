import { motion, AnimatePresence } from 'framer-motion';
import { X, Sun, Moon } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const { t } = useTranslation();
  const {
    theme, toggleTheme,
    language, fontSize,
    cursorSize, dyslexicFont,
    updateSetting,
  } = useTheme();

  const changeLanguage = (lng: string) => {
    updateSetting('language', lng);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AnimatePresence mode="wait">
        {isOpen && (
          <Dialog.Portal forceMount>
            {/* Backdrop with blur */}
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md"
              />
            </Dialog.Overlay>

            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
              {/* Modal Container */}
              <Dialog.Content asChild>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="relative w-full max-w-sm md:max-w-md bg-apple-white rounded-[24px] shadow-2xl overflow-hidden border border-apple-gray mx-auto pointer-events-auto"
                >
                  <Dialog.Title className="sr-only">{t('settings.title')}</Dialog.Title>
                  <Dialog.Description className="sr-only">
                    {t('settings.accessibility')}
                  </Dialog.Description>

                  {/* Header */}
                  <div className="flex items-center justify-between px-5 md:px-6 py-4 border-b border-apple-gray">
                    <h2 className="text-lg md:text-xl font-bold text-apple-text tracking-tight">{t('settings.title')}</h2>
                    <Dialog.Close asChild>
                      <button
                        className="p-1.5 md:p-2 hover:bg-apple-bg rounded-full transition-colors cursor-pointer"
                        aria-label={t('settings.close')}
                      >
                        <X size={20} className="text-apple-secondary" />
                      </button>
                    </Dialog.Close>
                  </div>

                  {/* Content */}
                  <div className="p-5 md:p-6 space-y-6 md:space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Theme Section */}
                    <div className="space-y-3 md:space-y-4">
                      <label id="theme-label" className="text-[10px] md:text-xs font-bold text-apple-secondary uppercase tracking-widest pl-1">
                        {t('settings.appearance')}
                      </label>

                      <div className="grid grid-cols-2 gap-3 md:gap-4" role="radiogroup" aria-labelledby="theme-label">
                        <button
                          role="radio"
                          aria-checked={theme === 'light'}
                          onClick={() => theme === 'dark' && toggleTheme()}
                          className={`flex flex-col items-center justify-center p-3 md:p-4 rounded-xl border-2 transition-all cursor-pointer ${
                            theme === 'light'
                              ? 'border-apple-blue bg-apple-blue/5 text-apple-blue shadow-sm'
                              : 'border-apple-gray text-apple-secondary hover:border-apple-secondary/30'
                          }`}
                        >
                          <Sun size={20} className="mb-2 md:w-6 md:h-6" />
                          <span className="text-xs md:text-sm font-semibold">{t('settings.light')}</span>
                        </button>

                        <button
                          role="radio"
                          aria-checked={theme === 'dark'}
                          onClick={() => theme === 'light' && toggleTheme()}
                          className={`flex flex-col items-center justify-center p-3 md:p-4 rounded-xl border-2 transition-all cursor-pointer ${
                            theme === 'dark'
                              ? 'border-apple-blue bg-apple-blue/5 text-apple-blue shadow-sm'
                              : 'border-apple-gray text-apple-secondary hover:border-apple-secondary/30'
                          }`}
                        >
                          <Moon size={20} className="mb-2 md:w-6 md:h-6" />
                          <span className="text-xs md:text-sm font-semibold">{t('settings.dark')}</span>
                        </button>
                      </div>
                    </div>

                    {/* Language Section */}
                    <div className="space-y-3 md:space-y-4">
                      <label id="lang-label" className="text-[10px] md:text-xs font-bold text-apple-secondary uppercase tracking-widest pl-1">
                        {t('settings.language')}
                      </label>

                      <div className="flex bg-apple-bg rounded-lg p-1 border border-apple-gray">
                        <button
                          onClick={() => changeLanguage('pt')}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs md:text-sm font-medium rounded-md transition-all cursor-pointer ${
                            language.startsWith('pt')
                              ? 'bg-apple-white shadow-sm text-apple-blue border border-apple-gray/20'
                              : 'text-apple-secondary hover:text-apple-text'
                          }`}
                        >
                          <span className="text-lg">🇧🇷</span>
                          {t('settings.portuguese')}
                        </button>
                        <button
                          onClick={() => changeLanguage('en')}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs md:text-sm font-medium rounded-md transition-all cursor-pointer ${
                            language.startsWith('en')
                              ? 'bg-apple-white shadow-sm text-apple-blue border border-apple-gray/20'
                              : 'text-apple-secondary hover:text-apple-text'
                          }`}
                        >
                          <span className="text-lg">🇺🇸</span>
                          {t('settings.english')}
                        </button>
                      </div>
                    </div>

                    {/* Accessibility Section */}
                    <div className="space-y-6 md:space-y-6 pt-2">
                      <label className="text-[10px] md:text-xs font-bold text-apple-secondary uppercase tracking-widest pl-1">
                        {t('settings.accessibility')}
                      </label>

                      {/* Font Size */}
                      <div className="space-y-2">
                        <p id="font-size-label" className="text-sm font-medium text-apple-text">{t('settings.font_size')}</p>
                        <div className="flex bg-apple-bg rounded-lg p-1 border border-apple-gray" role="group" aria-labelledby="font-size-label">
                          {(['normal', 'large', 'extralarge'] as const).map((size) => (
                            <button
                              key={size}
                              onClick={() => updateSetting('fontSize', size)}
                              aria-pressed={fontSize === size}
                              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                                fontSize === size
                                  ? 'bg-apple-white shadow-sm text-apple-blue'
                                  : 'text-apple-secondary hover:text-apple-text'
                              }`}
                            >
                              {size === 'normal' ? 'A' : size === 'large' ? 'A+' : 'A++'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Cursor Size */}
                      <div className="space-y-2">
                        <p id="cursor-size-label" className="text-sm font-medium text-apple-text">{t('settings.cursor_size')}</p>
                        <div className="flex bg-apple-bg rounded-lg p-1 border border-apple-gray" role="group" aria-labelledby="cursor-size-label">
                          {(['normal', 'large', 'extralarge'] as const).map((size) => (
                            <button
                              key={size}
                              onClick={() => updateSetting('cursorSize', size)}
                              aria-pressed={cursorSize === size}
                              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                                cursorSize === size
                                  ? 'bg-apple-white shadow-sm text-apple-blue'
                                  : 'text-apple-secondary hover:text-apple-text'
                              }`}
                            >
                              {size === 'normal' ? t('settings.normal') : size === 'large' ? t('settings.large') : t('settings.extra')}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Dyslexia Font */}
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <p id="dyslexia-font-label" className="text-sm font-medium text-apple-text">{t('settings.dyslexia_font')}</p>
                          <p className="text-[10px] text-apple-secondary">{t('settings.dyslexia_subtitle')}</p>
                        </div>
                        <button
                          role="switch"
                          aria-checked={dyslexicFont}
                          aria-labelledby="dyslexia-font-label"
                          onClick={() => updateSetting('dyslexicFont', !dyslexicFont)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                            dyslexicFont ? 'bg-apple-blue' : 'bg-apple-gray'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-apple-white transition-transform ${
                              dyslexicFont ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Version Info */}
                    <div className="pt-4 flex flex-col items-center border-t border-apple-gray">
                      <p className="text-[9px] md:text-[10px] text-apple-secondary font-medium tracking-widest uppercase opacity-50">
                        OCR Automation Engine POC
                      </p>
                    </div>
                  </div>
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
};
export default SettingsModal;
