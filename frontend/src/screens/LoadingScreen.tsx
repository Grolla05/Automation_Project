import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import { api } from '../services/api';
import { useWizardStore } from '../hooks/useWizardStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProgressInterval {
  threshold: number;
  text: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PROGRESS_INTERVALS: ProgressInterval[] = [
  { threshold: 30, text: 'Processando OCR em imagens...' },
  { threshold: 60, text: 'Extraindo dados técnicos...' },
  { threshold: 85, text: 'Formatando documento Word...' },
];

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * LoadingScreen — Rota `/process`
 *
 * Guard: redireciona para `/upload` se não houver arquivos na sessão.
 */
const LoadingScreen = () => {
  const navigate = useNavigate();
  const { sector, tests, files, setReportPath } = useWizardStore();

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Iniciando processamento...');
  const isMountedRef = useRef(true);

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (files.length === 0) {
    return <Navigate to="/upload" replace />;
  }

  // ── OCR Processing ─────────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    isMountedRef.current = true;
    let timer: ReturnType<typeof setInterval>;

    const processBackend = async () => {
      try {
        const result = await api.processImages(
          sector,
          tests,
          files
        );

        if (isMountedRef.current) {
          setProgress(100);
          setStatus('Finalizando relatório...');
          setTimeout(() => {
            setReportPath(result.path);
            navigate('/result');
          }, 800);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setStatus('Erro no processamento.');
          console.error('OCR API error:', err);
        }
      }
    };

    const runFakeProgress = () => {
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return 90;
          const next = prev + Math.random() * 8;
          const currentStatus = PROGRESS_INTERVALS.find((i) => next <= i.threshold);
          if (currentStatus) setStatus(currentStatus.text);
          return next;
        });
      }, 500);
    };

    runFakeProgress();
    processBackend();

    return () => {
      isMountedRef.current = false;
      clearInterval(timer);
    };
  // session values are stable references from SessionContext — safe to list
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
