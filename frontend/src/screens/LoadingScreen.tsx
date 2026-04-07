import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
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
  { threshold: 15, text: 'Validando integridade dos arquivos...' },
  { threshold: 30, text: 'Lendo metadados da Capa de Liberação...' },
  { threshold: 45, text: 'Extraindo tabelas do Registro de Ensaio...' },
  { threshold: 60, text: 'Executando extração nas imagens de amostra...' },
  { threshold: 80, text: 'Executando implante de dados no relatório...' },
  { threshold: 95, text: 'Gerando relatório final no formato Word...' },
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
      } catch (err: any) {
        if (isMountedRef.current) {
          const errorMessage = err?.message || 'Erro desconhecido no processamento.';
          setStatus(`❌ ${errorMessage}`);
          clearInterval(timer);
          console.error('OCR API error:', err);
          toast.error(errorMessage, { duration: 8000 });
        }
      }
    };

    const runFakeProgress = () => {
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return 95;
          const increment = Math.random() * 5 + 1; // Incremento mais suave e constante
          const next = prev + increment;
          const currentStatus = PROGRESS_INTERVALS.find((i) => next <= i.threshold);
          if (currentStatus) setStatus(currentStatus.text);
          return next;
        });
      }, 800);
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
      <Card className="max-w-xl w-full">
        <div className="flex flex-col items-center text-center space-y-8 p-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-apple-text tracking-tight">Processando Documentos</h2>
            <p className="text-apple-secondary">Sincronizando dados técnicos com o layout de ensaio.</p>
          </div>

          {/* Skeleton Mockup to increase speed perception */}
          <div className="w-full space-y-4 bg-apple-gray/10 p-6 rounded-apple border border-apple-gray/20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-apple-blue/20 rounded-lg animate-pulse" />
              <div className="space-y-2 flex-1 text-left">
                <div className="h-3 bg-apple-blue/10 rounded w-3/4 animate-pulse" />
                <div className="h-2 bg-apple-blue/5 rounded w-1/2 animate-pulse" />
              </div>
            </div>
            <div className="space-y-2 border-t border-apple-gray/20 pt-4">
                {[1, 2].map(i => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="h-2 bg-apple-gray/30 rounded w-1/3 animate-pulse" />
                    <div className="h-2 bg-apple-gray/20 rounded w-1/4 animate-pulse" />
                  </div>
                ))}
            </div>
          </div>

          <div className="w-full space-y-4">
             {/* Progress bar */}
            <div className="relative w-full h-3 bg-apple-gray/30 rounded-full overflow-hidden">
                <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'easeInOut', duration: 0.5 }}
                className="absolute top-0 left-0 h-full bg-apple-blue shadow-[0_0_15px_rgba(0,113,227,0.6)]"
                />
            </div>

            <div className="flex justify-between items-center px-1">
                <p className="text-apple-blue font-semibold text-sm h-5">{status}</p>
                <span className="text-apple-text font-bold text-lg tabular-nums">
                {Math.min(100, Math.round(progress))}%
                </span>
            </div>
          </div>

          {/* Bouncing dots */}
          <div className="pt-2">
            <div className="flex space-x-3">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: [1, 1.4, 1], 
                    opacity: [0.3, 1, 0.3],
                    backgroundColor: ['#86868b', '#0071e3', '#86868b']
                  }}
                  transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.3 }}
                  className="w-2 h-2 rounded-full"
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
