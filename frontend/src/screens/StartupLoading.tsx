import { useEffect } from 'react';
import { motion } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StartupLoadingProps {
  /** Callback disparado após o tempo de splash screen */
  onFinish: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const StartupLoading = ({ onFinish }: StartupLoadingProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-apple-bg pointer-events-none"
    >
      <div className="relative flex flex-col items-center">
        {/* Glow Effect / Brush */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute w-[80vw] h-[80vw] max-w-2xl max-h-2xl bg-apple-blue/30 blur-[60px] md:blur-[100px] rounded-full pointer-events-none"
        />

        {/* Logo Container with Pulse */}
        <motion.div
          animate={{ scale: [0.95, 1.05, 0.95] }}
          exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="relative z-10 w-[50vw] h-[50vw] max-w-[18rem] md:w-72 md:h-72 flex items-center justify-center p-8 md:p-16 bg-white rounded-full shadow-2xl overflow-hidden border border-apple-gray"
        >
          <img
            src="/Logo_TUV.jpg"
            alt="TÜV Rheinland Logo"
            className="w-full h-auto object-contain"
          />
        </motion.div>

        {/* Slogan and System status */}
        <motion.div
          exit={{ opacity: 0, y: 20 }}
          className="mt-8 md:mt-12 flex flex-col items-center space-y-4 md:space-y-6 px-4"
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-apple-blue font-bold text-xl md:text-3xl tracking-tight text-center"
          >
            Precisely Right.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="flex items-center space-x-2 md:space-x-3"
          >
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-apple-blue rounded-full animate-pulse" />
            <p className="text-apple-secondary text-[10px] md:text-xs font-bold tracking-[0.3em] md:tracking-[0.4em] uppercase opacity-60">
              Inicializando Sistema
            </p>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default StartupLoading;
