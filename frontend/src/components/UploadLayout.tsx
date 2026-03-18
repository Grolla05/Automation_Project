import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, Image as ImageIcon, CheckCircle2, Circle, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import Button from './ui/Button';
import Card from './ui/Card';
import { api } from '../services/api';
import { createUploadSchema, type UploadFormData } from '../schemas/uploadSchema';

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isExcelFile = (file: File): boolean => {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return ext === 'xlsx' || ext === 'xls';
};

// ─── Constants ────────────────────────────────────────────────────────────────

const VALID_IMAGE_TYPES = ['image/png', 'image/jpeg'];
const VALID_TYPES = [...VALID_IMAGE_TYPES, 'application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];

// ─── Component ────────────────────────────────────────────────────────────────

const UploadLayout = ({ sessionData, onNext, onBack }: UploadLayoutProps) => {
  const [isHovering, setIsHovering] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isTeste2 = sessionData?.tests?.includes('TESTE2');
  const isASE = sessionData?.testType === 'ASE';
  const REQUIRED_FILES_TESTE2 = ['image_test2.1', 'image_test2.2'];

  const schema = createUploadSchema({
    tests: sessionData?.tests ?? [],
    testType: sessionData?.testType,
  });

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    trigger,
  } = useForm<UploadFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      files: [],
    },
  });

  const files = watch('files');

  const hasFile = (reqName: string): boolean =>
    files.some((f) => {
      const nameWithoutExt = f.name.split('.').slice(0, -1).join('.');
      return (
        nameWithoutExt.toLowerCase() === reqName.toLowerCase() ||
        f.name.toLowerCase().startsWith(reqName.toLowerCase())
      );
    });

  const hasExcel = (): boolean => files.some(isExcelFile);

  const areRequirementsMet = (): boolean => {
    const hasPDF = files.some(f => f.type === 'application/pdf');
    const hasImage = files.some(f => ['image/png', 'image/jpeg'].includes(f.type));
    const hasExcelFile = files.some(isExcelFile);

    // Requisitos básicos para todos
    if (!hasPDF || !hasImage || !hasExcelFile) return false;

    // Requisitos específicos para TESTE2
    if (isTeste2) {
      const allTeste2Met = REQUIRED_FILES_TESTE2.every(reqName => 
        files.some(f => {
          const nameWithoutExt = f.name.split('.').slice(0, -1).join('.');
          return (
            nameWithoutExt.toLowerCase() === reqName.toLowerCase() ||
            f.name.toLowerCase().startsWith(reqName.toLowerCase())
          );
        })
      );
      if (!allTeste2Met) return false;
    }

    return true;
  };

  const validateRequirements = (files: File[]): string[] => {
    const errors: string[] = [];
    const hasPDF = files.some(f => f.type === 'application/pdf');
    const hasImage = files.some(f => ['image/png', 'image/jpeg'].includes(f.type));
    const hasExcelFile = files.some(isExcelFile);

    if (!hasPDF) errors.push('A Capa de Liberação (.PDF) é obrigatória.');
    if (!hasImage) errors.push('Pelo menos uma Imagem Análoga (.png/jpeg) é obrigatória.');
    if (!hasExcelFile) errors.push('A Planilha de Registro (.xlsx/xls) é obrigatória.');

    if (isTeste2) {
      REQUIRED_FILES_TESTE2.forEach(reqName => {
        const met = files.some(f => {
          const nameWithoutExt = f.name.split('.').slice(0, -1).join('.');
          return (
            nameWithoutExt.toLowerCase() === reqName.toLowerCase() ||
            f.name.toLowerCase().startsWith(reqName.toLowerCase())
          );
        });
        if (!met) errors.push(`Arquivo obrigatório do TESTE2 ausente: ${reqName}`);
      });
    }

    return errors;
  };

  const handleProcessClick = async (data: UploadFormData) => {
    const reqErrors = validateRequirements(data.files);
    if (reqErrors.length > 0) {
      toast.error(reqErrors[0]);
      setApiError(reqErrors[0]); // Mostra o primeiro erro de requisito
      setTimeout(() => setApiError(null), 4000);
      return;
    }

    setIsProcessing(true);
    setApiError(null);
    try {
      await api.checkLayout(sessionData?.tests ?? []);
      toast.success('Layout validado com sucesso!');
      onNext(data.files);
    } catch (err) {
      // O erro já é tratado com toast.error dentro do api.checkLayout
      const message = err instanceof Error ? err.message : 'Layout não cadastrado';
      setApiError(message);
      setTimeout(() => setApiError(null), 4000);
    } finally {
      setIsProcessing(false);
    }
  };

  const addFiles = async (newFiles: File[]) => {
    setApiError(null);
    
    // Filtro rigoroso antes de atualizar o estado
    const initialFilesCount = files.length;
    const validFiles = newFiles.filter(file => {
      const isSupported = VALID_TYPES.includes(file.type) || isExcelFile(file);
      if (!isSupported) {
        toast.error(`O arquivo ${file.name} não é suportado.`);
        setApiError(`O arquivo ${file.name} não é suportado.`);
        setTimeout(() => setApiError(null), 4000);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      const updatedFiles = [...files, ...validFiles];
      setValue('files', updatedFiles);
      await trigger('files');
      toast.success(`${validFiles.length} arquivo(s) adicionado(s).`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    addFiles(selectedFiles);
    // Limpar o input para permitir selecionar o mesmo arquivo novamente se for deletado
    if (e.target) e.target.value = '';
  };

  const removeFile = async (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setValue('files', updatedFiles);
    await trigger('files');
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
        <p className="text-apple-secondary text-lg">Selecione os arquivos análogos ao ensaio.</p>
      </div>

      <Card className="max-w-3xl">
        <form onSubmit={handleSubmit(handleProcessClick)} className="space-y-6">
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
                {/* Requisitos Fixos (Arquivos Obrigatórios para Todos) */}
                <div className={twMerge(
                  'flex items-center space-x-3 p-3 rounded-lg border transition-colors',
                  files.some(f => f.type === 'application/pdf')
                    ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-500/10 dark:border-green-500/20'
                    : 'bg-white border-apple-gray text-apple-secondary dark:bg-apple-gray/20 dark:border-apple-gray/30'
                )}>
                  {files.some(f => f.type === 'application/pdf')
                    ? <CheckCircle2 size={18} className="text-green-500" />
                    : <Circle size={18} className="text-apple-secondary/50" />}
                  <span className="font-medium text-sm">Capa de Liberação (.pdf)</span>
                </div>

                <div className={twMerge(
                  'flex items-center space-x-3 p-3 rounded-lg border transition-colors',
                  files.some(f => ['image/png', 'image/jpeg'].includes(f.type))
                    ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-500/10 dark:border-green-500/20'
                    : 'bg-white border-apple-gray text-apple-secondary dark:bg-apple-gray/20 dark:border-apple-gray/30'
                )}>
                  {files.some(f => ['image/png', 'image/jpeg'].includes(f.type))
                    ? <CheckCircle2 size={18} className="text-green-500" />
                    : <Circle size={18} className="text-apple-secondary/50" />}
                  <span className="font-medium text-sm">Imagens Análogas (.png/jpeg)</span>
                </div>

                {/* Registro de Ensaio (Já existente no ASE, mas agora unificado) */}
                <div className={twMerge(
                  'flex items-center space-x-3 p-3 rounded-lg border transition-colors',
                  hasExcel()
                    ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-500/10 dark:border-green-500/20'
                    : 'bg-white border-apple-gray text-apple-secondary dark:bg-apple-gray/20 dark:border-apple-gray/30'
                )}>
                  {hasExcel()
                    ? <CheckCircle2 size={18} className="text-green-500" />
                    : <Circle size={18} className="text-apple-secondary/50" />}
                  <span className="font-medium text-sm">Registro de Ensaio (.xlsx/xls)</span>
                </div>

                {/* Requisitos Específicos Adicionais (Ex: TESTE2) */}
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
              errors.files ? 'border-red-500 bg-red-50 dark:bg-red-500/10' : ''
            )}
          >
            <motion.div
              animate={errors.files ? { x: [-10, 10, -10, 10, 0] } : {}}
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
                errors.files ? 'bg-red-500 text-white' : 'bg-white dark:bg-apple-gray text-apple-blue'
              )}>
                <Upload size={28} />
              </div>
              <p className={twMerge('font-medium text-lg transition-colors', errors.files ? 'text-red-500' : 'text-apple-text')}>
                {errors.files ? 'Arquivo inválido!' : 'Arraste arquivos aqui'}
              </p>
              <p className={twMerge('text-sm mt-1 transition-colors', errors.files ? 'text-red-400' : 'text-apple-secondary')}>
                {errors.files ? 'Revise os requisitos de arquivo' : 'ou clique para navegar'}
              </p>
            </motion.div>
          </div>

          <AnimatePresence>
            {errors.files?.message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-apple text-sm font-medium flex items-center gap-2"
              >
                <AlertCircle size={16} />
                {errors.files.message}
              </motion.div>
            )}
            {/* Caso existam múltiplos erros de refinamento no Zod */}
            {errors.files && !errors.files.message && Array.isArray(errors.files) && (
               <div className="space-y-2">
                 {errors.files.map((err: any, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-apple text-sm font-medium flex items-center gap-2"
                    >
                      <AlertCircle size={16} />
                      {err.message}
                    </motion.div>
                 ))}
               </div>
            )}
            {apiError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-apple text-sm font-medium text-center"
              >
                {apiError}
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
                    type="button"
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
            <Button variant="ghost" type="button" onClick={onBack} disabled={isProcessing}>Voltar</Button>
            <div className="flex items-center space-x-4">
              <Button
                variant="blue"
                type="submit"
                disabled={isProcessing || !!errors.files || files.length === 0 || !areRequirementsMet()}
                className="px-12"
              >
                {isProcessing ? 'Verificando...' : `Processar${files.length > 0 ? ` (${files.length})` : ''}`}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </motion.div>
  );
};

export default UploadLayout;
