import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { CheckCircle2, FileDown, RotateCcw } from 'lucide-react';
import { api } from '../services/api';
import { useSession } from '../context/SessionContext';

/**
 * CompletionScreen — Rota `/result`
 *
 * Guard: redireciona para `/` se não houver reportPath na sessão.
 */
const CompletionScreen = () => {
  const navigate = useNavigate();
  const { session, resetSession } = useSession();
  const [downloading, setDownloading] = useState(false);

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (!session.reportPath) {
    return <Navigate to="/" replace />;
  }

  const reportPath = session.reportPath;

  const handleDownload = async () => {
    setDownloading(true);
    await api.downloadReport(reportPath);
    setDownloading(false);
  };

  const handleReset = () => {
    resetSession();
    navigate('/');
  };

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="flex flex-col items-center justify-center min-h-[80vh] w-full px-4"
    >
      <Card className="max-w-md">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
            className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-sm"
          >
            <CheckCircle2 size={56} className="text-green-500" />
          </motion.div>

          <h2 className="text-3xl font-bold text-apple-text tracking-tight mb-2">
            Relatório Concluído!
          </h2>
          <p className="text-apple-secondary text-lg mb-8">
            Os dados foram processados com sucesso. O seu documento Word já está pronto.
          </p>

          <div className="flex flex-col w-full space-y-3">
            <Button
              variant="blue"
              onClick={handleDownload}
              disabled={downloading}
              className="w-full flex items-center justify-center space-x-2 py-4"
            >
              <FileDown size={20} />
              <span>{downloading ? 'Abrindo...' : 'Abrir Relatório Word (.docx)'}</span>
            </Button>

            <Button
              variant="ghost"
              onClick={handleReset}
              className="w-full flex items-center justify-center space-x-2"
            >
              <RotateCcw size={18} />
              <span>Iniciar Novo Processamento</span>
            </Button>
          </div>
        </div>
      </Card>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-8 text-apple-secondary text-sm font-medium"
      >
        O arquivo foi salvo em: {reportPath}
      </motion.p>
    </motion.div>
  );
};

export default CompletionScreen;
