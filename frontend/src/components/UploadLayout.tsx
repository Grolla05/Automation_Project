import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, Image as ImageIcon, CheckCircle2, Circle, FileSpreadsheet } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import Button from './ui/Button';
import Card from './ui/Card';
import { api } from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Dados de sessão passados de App para UploadLayout */
export interface SessionData {
  sector: string;
  testType?: string;
  tests: string[];
  files?: File[];
}

interface UploadLayoutProps {
  sessionData: SessionData;
  onNext: (files: File[]) => void;
  onBack: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REQUIRED_FILES_TESTE2 = ['image_test2.1', 'image_test2.2'];
const VALID_IMAGE_TYPES = ['image/png', 'image/jpeg'];
const VALID_TYPES = [...VALID_IMAGE_TYPES, 'application/pdf'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isExcelFile = (file: File): boolean => {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return ext === 'xlsx' || ext === 'xls';
};

// ─── Component ────────────────────────────────────────────────────────────────

const UploadLayout = ({ sessionData, onNext, onBack }: UploadLayoutProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isHovering, setIsHovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isTeste2 = sessionData?.tests?.includes('TESTE2');
  const isASE = sessionData?.testType === 'ASE';

  const hasFile = (reqName: string): boolean =>
    files.some((f) => {
      const nameWithoutExt = f.name.split('.').slice(0, -1).join('.');
      return (
        nameWithoutExt.toLowerCase() === reqName.toLowerCase() ||
        f.name.toLowerCase().startsWith(reqName.toLowerCase())
      );
    });

  const hasExcel = (): boolean => files.some(isExcelFile);

  let missingFiles: string[] = [];
  let hasExtraFiles = false;
  let canProcess = false;

  if (isASE) {
    if (!hasExcel()) missingFiles.push('Planilha Excel (.xlsx ou .xls)');
    hasExtraFiles = files.length > 1;
    canProcess = missingFiles.length === 0 && !hasExtraFiles;
  } else if (isTeste2) {
    missingFiles = REQUIRED_FILES_TESTE2.filter((req) => !hasFile(req));
    hasExtraFiles = files.length > REQUIRED_FILES_TESTE2.length;
    canProcess = missingFiles.length === 0 && !hasExtraFiles;
  } else {
    canProcess = files.length > 0;
  }

  const handleProcessClick = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      await api.checkLayout(sessionData?.tests ?? []);
      onNext(files);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'não há layout cadastrado para este Ensaio';
      setError(message);
      setTimeout(() => setError(null), 4000);
    } finally {
      setIsProcessing(false);
    }
  };

  const addFiles = (newFiles: File[]) => {
    setError(null);
    let hasInvalid = false;

    const validFiles = newFiles.filter((file) => {
      const isValid = VALID_TYPES.includes(file.type) || isExcelFile(file);
      if (!isValid) hasInvalid = true;
      return isValid;
    });

    if (hasInvalid) {
      setError('Tipo de arquivo não suportado. Use apenas PNG, JPG, PDF ou Excel (.xlsx, .xls).');
      setTimeout(() => setError(null), 4000);
    }

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    addFiles(selectedFiles);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsHovering(true);
  };

  const handleDragLeave = () => setIsHovering(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsHovering(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const getFileLabel = (file: File): string => {
    if (file.type === 'application/pdf') return 'Documento PDF';
    if (isExcelFile(file)) return 'Planilha Excel';
    return 'Imagem';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="flex flex-col items-center justify-center min-h-[80vh] w-full px-4"
    >
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-apple-text tracking-tight mb-2">Upload de Arquivos</h1>
        <p className="text-apple-secondary text-lg">Selecione imagens (PNG/JPG) ou arquivos PDF.</p>
      </div>

      <Card className="max-w-3xl">
        <div className="space-y-6">
          {/* File Requirements for Special Tests */}
          {(isTeste2 || isASE) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-apple-blue/5 border border-apple-blue/20 rounded-apple p-5"
            >
              <h3 className="text-sm font-semibold text-apple-blue mb-3">
                Pré-requisitos do Ensaio {isASE ? 'ASE' : 'TESTE2'}
              </h3>
              <p className="text-xs text-apple-secondary mb-3">
                Para processar este ensaio, você deve anexar obrigatoriamente os seguintes arquivos:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {isTeste2 && REQUIRED_FILES_TESTE2.map((reqName) => {
                  const isMet = hasFile(reqName);
                  return (
                    <div
                      key={reqName}
                      className={twMerge(
                        'flex items-center space-x-3 p-3 rounded-lg border transition-colors',
                        isMet
                          ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-500/10 dark:border-green-500/20'
                          : 'bg-white border-apple-gray text-apple-secondary dark:bg-apple-gray/20 dark:border-apple-gray/30'
                      )}
                    >
                      {isMet
                        ? <CheckCircle2 size={18} className="text-green-500" />
                        : <Circle size={18} className="text-apple-secondary/50" />}
                      <span className="font-medium text-sm">{reqName}</span>
                    </div>
                  );
                })}

                {isASE && (
                  <div className={twMerge(
                    'flex items-center space-x-3 p-3 rounded-lg border transition-colors',
                    hasExcel()
                      ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-500/10 dark:border-green-500/20'
                      : 'bg-white border-apple-gray text-apple-secondary dark:bg-apple-gray/20 dark:border-apple-gray/30'
                  )}>
                    {hasExcel()
                      ? <CheckCircle2 size={18} className="text-green-500" />
                      : <Circle size={18} className="text-apple-secondary/50" />}
                    <span className="font-medium text-sm">Planilha de Registro de Ensaio (.xlsx, .xls)</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Dropzone Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={twMerge(
              'relative border-2 border-dashed rounded-apple-lg p-12 flex flex-col items-center justify-center transition-all cursor-pointer',
              isHovering
                ? 'border-apple-blue bg-apple-blue/5 scale-[1.01]'
                : 'border-apple-gray bg-apple-bg hover:border-apple-secondary/50',
              error ? 'border-red-500 bg-red-50 dark:bg-red-500/10' : ''
            )}
          >
            <motion.div
              animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center"
            >
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf,.xlsx,.xls"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <div className={twMerge(
                'w-16 h-16 rounded-full shadow-apple flex items-center justify-center mb-4 transition-colors',
                error ? 'bg-red-500 text-white' : 'bg-white dark:bg-apple-gray text-apple-blue'
              )}>
                <Upload size={28} />
              </div>
              <p className={twMerge('font-medium text-lg transition-colors', error ? 'text-red-500' : 'text-apple-text')}>
                {error ? 'Arquivo inválido!' : 'Arraste arquivos aqui'}
              </p>
              <p className={twMerge('text-sm mt-1 transition-colors', error ? 'text-red-400' : 'text-apple-secondary')}>
                {error ? 'Use apenas Imagens, PDF ou Excel' : 'ou clique para navegar'}
              </p>
            </motion.div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-apple text-sm font-medium text-center"
              >
                {error}
              </motion.div>
            )}
            {!error && hasExtraFiles && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-apple text-sm font-medium text-center"
              >
                Você anexou arquivos extras. Por favor, mantenha e envie apenas os exatos{' '}
                {isASE ? 1 : REQUIRED_FILES_TESTE2.length} arquivos exigidos pelo ensaio.
              </motion.div>
            )}
          </AnimatePresence>

          {/* File List */}
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            <AnimatePresence>
              {files.map((file, index) => (
                <motion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center justify-between p-3 bg-apple-bg rounded-apple border border-apple-gray group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-white p-2 rounded-lg">
                      {file.type === 'application/pdf' ? (
                        <FileText size={18} className="text-red-500" />
                      ) : isExcelFile(file) ? (
                        <FileSpreadsheet size={18} className="text-green-600" />
                      ) : (
                        <ImageIcon size={18} className="text-apple-secondary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-apple-text truncate max-w-[200px] md:max-w-xs">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-apple-secondary uppercase tracking-wider">
                        {getFileLabel(file)} • {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                    className="p-1 hover:bg-red-50 hover:text-red-500 rounded-full text-apple-secondary transition-colors"
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-apple-gray">
            <Button variant="ghost" onClick={onBack} disabled={isProcessing}>Voltar</Button>
            <div className="flex items-center space-x-4">
              {(isTeste2 || isASE) && missingFiles.length > 0 && (
                <span className="text-xs text-red-500 font-medium">Anexe os arquivos obrigatórios</span>
              )}
              {(isTeste2 || isASE) && missingFiles.length === 0 && hasExtraFiles && (
                <span className="text-xs text-red-500 font-medium">Remova os arquivos extras</span>
              )}
              <Button
                variant="blue"
                disabled={!canProcess || isProcessing}
                onClick={handleProcessClick}
                className="px-12"
              >
                {isProcessing ? 'Verificando...' : `Processar${files.length > 0 ? ` (${files.length})` : ''}`}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default UploadLayout;
