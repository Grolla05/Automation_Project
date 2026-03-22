import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Card from '../components/ui/Card';
import { api } from '../services/api';
import { useSession } from '../context/SessionContext';

// ─── Component ────────────────────────────────────────────────────────────────

const LoadingScreen = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { session, setReportPath } = useSession();

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(t('loading.startup'));
  const isMountedRef = useRef(true);

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (session.files.length === 0) {
    return <Navigate to="/upload" replace />;
  }


  // ── OCR Processing ─────────────────────────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;

    const processBackend = async () => {
      try {
        const result = await api.processImages(
          session.sector,
          session.tests,
          session.files,
          (progress, message) => {
            if (isMountedRef.current) {
              setProgress(progress);
              setStatus(message);
            }
          }
        );

        if (isMountedRef.current) {
          setProgress(100);
          setStatus(t('loading.finalizing'));
          setTimeout(() => {
            setReportPath(result.path);
            navigate('/result');
          }, 800);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setStatus(t('loading.error'));
          console.error('OCR API error:', err);
        }
      }
    };

    processBackend();

    return () => {
      isMountedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  return (
    <motion.div
      key="process"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="flex flex-col items-center justify-center min-h-[80vh] w-full px-4"
    >
      <Card className="max-w-md">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Progress bar */}
          <div className="relative w-full h-2 bg-apple-gray rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeInOut', duration: 0.5 }}
              className="absolute top-0 left-0 h-full bg-apple-blue shadow-[0_0_10px_rgba(0,113,227,0.5)]"
            />
          </div>

          <div className="flex flex-col items-center space-y-2">
            <span className="text-4xl font-bold text-apple-text tracking-tighter">
              {Math.min(100, Math.round(progress))}%
            </span>
            <p className="text-apple-secondary font-medium animate-pulse">{status}</p>
          </div>

          {/* Bouncing dots */}
          <div className="pt-4">
            <div className="flex space-x-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                  className="w-2.5 h-2.5 bg-apple-blue rounded-full"
                />
              ))}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default LoadingScreen;
