import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, Image as ImageIcon, CheckCircle2, Circle, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useWizardStore } from '../hooks/useWizardStore';
import Button from './ui/Button';
import Card from './ui/Card';
import { api } from '../services/api';
import { createUploadSchema, type UploadFormData } from '../schemas/uploadSchema';
import { REQUIRED_IMAGE_FILES, type ImageRequirement } from '../lib/data';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadLayoutProps {
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
const VALID_TYPES = [
  ...VALID_IMAGE_TYPES,
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel'
];

// ─── Component ────────────────────────────────────────────────────────────────

const UploadLayout = ({ onNext, onBack }: UploadLayoutProps) => {
  const { testType, tests } = useWizardStore();
  const [isHovering, setIsHovering] = useState(false);
  const [isDraggingInvalid, setIsDraggingInvalid] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isTeste2 = tests?.includes('TESTE2');
  const isASE = testType === 'ASE';
  
  // Obtém lista de requisitos de imagem baseado nos ensaios selecionados
  const getRequiredFilesList = (): ImageRequirement[] => {
    let list: ImageRequirement[] = [];
    tests?.forEach(test => {
      if (REQUIRED_IMAGE_FILES[test]) {
        list = [...list, ...REQUIRED_IMAGE_FILES[test]];
      }
    });
    // Remove duplicados por label
    const seen = new Set();
    return list.filter(req => {
      const label = typeof req === 'string' ? req : req.label;
      if (seen.has(label)) return false;
      seen.add(label);
      return true;
    });
  };

  const dynamicRequiredNames = getRequiredFilesList();

  const schema = createUploadSchema({
    tests: tests ?? [],
    testType: testType,
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

  const hasFile = (req: ImageRequirement): boolean =>
    files.some((f) => {
      const normalize = (str: string) =>
        str
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, ' ')
          .trim();

      const fileName = normalize(f.name.split('.').slice(0, -1).join('.'));
      let keywords: string[];
      if (typeof req === 'string') {
        keywords = normalize(req).split(' ').filter(Boolean);
      } else {
        keywords = req.keywords;
      }
      // Todas as palavras-chave precisam estar presentes no nome do arquivo
      return keywords.every(kw => fileName.includes(kw));
    });

  const hasExcel = (): boolean => files.some(isExcelFile);

  const areRequirementsMet = (): boolean => {
    const hasPDF = files.some(f => f.type === 'application/pdf');
    const hasImage = files.some(f => ['image/png', 'image/jpeg'].includes(f.type));
    const hasExcelFile = files.some(isExcelFile);

    // Requisitos básicos para todos
    if (!hasPDF || !hasImage || !hasExcelFile) return false;

    // Requisitos específicos dinâmicos
    if (dynamicRequiredNames.length > 0) {
      const allMet = dynamicRequiredNames.every(req => hasFile(req));
      if (!allMet) return false;
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

    if (dynamicRequiredNames.length > 0) {
      dynamicRequiredNames.forEach(req => {
        if (!hasFile(req)) {
          const label = typeof req === 'string' ? req : req.label;
          errors.push(`Arquivo obrigatório ausente: ${label}`);
        }
      });
    }

    return errors;
  };

  const handleProcessClick = async (data: UploadFormData) => {
    const reqErrors = validateRequirements(data.files);
    if (reqErrors.length > 0) {
      toast.error(reqErrors[0]);
      setApiError(reqErrors[0]);
      setTimeout(() => setApiError(null), 4000);
      return;
    }

    setIsProcessing(true);
    setApiError(null);
    try {
      await api.checkLayout(tests ?? []);
      toast.success('Layout validado com sucesso!');
      // Renomeia arquivos de imagem para o tagName exato antes de enviar
      onNext(renameFilesToTags(data.files));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Layout não cadastrado';
      setApiError(message);
      setTimeout(() => setApiError(null), 4000);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Renomeia cada arquivo de imagem para o `tagName` exato do requisito
   * que ele satisfaz. Isso garante que o backend possa mapear
   * nome-do-arquivo → placeholder-no-docx sem ambiguidade.
   *
   * Ex: usuário envia 'minha_foto_embalagem_v2.jpg'
   *     matched com req { tagName: 'foto_embalagem' }
   *     arquivo enviado como  'foto_embalagem.jpg'
   */
  const renameFilesToTags = (originalFiles: File[]): File[] => {
    const usedTagNames = new Set<string>();

    return originalFiles.map((file) => {
      // Só renomeia imagens — PDF e Excel mantêm seu nome original
      const isImage = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/bmp'].includes(file.type);
      if (!isImage) return file;

      // Encontra o primeiro requisito dinâmico que este arquivo satisfaz
      // e cujo tagName ainda não foi usado (evita duplicatas)
      for (const req of dynamicRequiredNames) {
        if (typeof req === 'string') continue;

        const { tagName } = req;
        if (usedTagNames.has(tagName)) continue;

        if (hasFileMatch(file, req)) {
          usedTagNames.add(tagName);
          const ext = file.name.split('.').pop() ?? 'jpg';
          const newName = `${tagName}.${ext}`;
          return new File([file], newName, { type: file.type });
        }
      }

      // Não bateu com nenhum requisito dinâmico — mantém nome original
      return file;
    });
  };

  /** Verifica se um arquivo específico satisfaz um requisito dinâmico */
  const hasFileMatch = (file: File, req: { label: string; keywords: string[]; tagName: string }): boolean => {
    const normalize = (str: string) =>
      str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
    const fileName = normalize(file.name.split('.').slice(0, -1).join('.'));
    return req.keywords.every((kw) => fileName.includes(kw));
  };

  const addFiles = async (newFiles: File[]) => {
    setApiError(null);
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

    // Validação imediata de tipo durante o drag
    const items = Array.from(e.dataTransfer.items);
    const hasInvalid = items.some(item => {
      if (item.kind === 'file') {
        const type = item.type;
        const name = (item as any).name || ''; // name nem sempre está disponível no dragover em alguns browsers, mas o type sim
        const isExcel = type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                        type === 'application/vnd.ms-excel' ||
                        name.endsWith('.xlsx') || name.endsWith('.xls');
        return !VALID_TYPES.includes(type) && !isExcel;
      }
      return false;
    });
    setIsDraggingInvalid(hasInvalid);
  };

  const handleDragLeave = () => {
    setIsHovering(false);
    setIsDraggingInvalid(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsHovering(false);
    setIsDraggingInvalid(false);
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

                {/* Requisitos Específicos Adicionais Dinâmicos */}
                {dynamicRequiredNames.map((req) => {
                  const isMet = hasFile(req);
                  const label = typeof req === 'string' ? req : req.label;
                  return (
                    <div
                      key={label}
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
                      <span className="font-medium text-sm">{String(label)}</span>
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
              'relative border-2 border-dashed rounded-apple-lg p-12 flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden',
              isHovering
                ? isDraggingInvalid 
                  ? 'border-red-500 bg-red-500/5 scale-[1.01]' 
                  : 'border-apple-blue bg-apple-blue/5 scale-[1.01]'
                : 'border-apple-gray bg-apple-bg hover:border-apple-secondary/50',
              errors.files ? 'border-red-500 bg-red-50 dark:bg-red-500/10' : ''
            )}
          >
            {/* Background Blur effect on hover */}
            <AnimatePresence>
              {isHovering && !isDraggingInvalid && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-apple-blue/10 backdrop-blur-[2px] z-0"
                />
              )}
            </AnimatePresence>

            <motion.div
              animate={errors.files ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center relative z-10"
            >
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf,.xlsx,.xls"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <motion.div 
                animate={isHovering && !isDraggingInvalid ? { y: -10 } : { y: 0 }}
                className={twMerge(
                  'w-16 h-16 rounded-full shadow-apple flex items-center justify-center mb-4 transition-colors',
                  errors.files || (isHovering && isDraggingInvalid) 
                    ? 'bg-red-500 text-white' 
                    : 'bg-white dark:bg-apple-gray text-apple-blue'
                )}
              >
                <Upload size={28} />
              </motion.div>
              <p className={twMerge(
                'font-medium text-lg transition-colors', 
                errors.files || (isHovering && isDraggingInvalid) ? 'text-red-500' : 'text-apple-text'
              )}>
                {isHovering 
                  ? isDraggingInvalid ? 'Formato não suportado!' : 'Solte para enviar' 
                  : errors.files ? 'Arquivo inválido!' : 'Arraste arquivos aqui'}
              </p>
              <p className={twMerge(
                'text-sm mt-1 transition-colors', 
                errors.files || (isHovering && isDraggingInvalid) ? 'text-red-400' : 'text-apple-secondary'
              )}>
                {isHovering 
                  ? isDraggingInvalid ? 'Verifique os tipos permitidos' : 'PDF, PNG, JPG ou Excel'
                  : errors.files ? 'Revise os requisitos de arquivo' : 'ou clique para navegar'}
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
            <AnimatePresence initial={false}>
              {files.map((file, index) => (
                <motion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
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
                    className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full text-apple-secondary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Remover arquivo"
                  >
                    <X size={18} />
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
                isLoading={isProcessing}
                disabled={!!errors.files || files.length === 0 || !areRequirementsMet()}
                className="px-12"
              >
                Processar{files.length > 0 ? ` (${files.length})` : ''}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </motion.div>
  );
};

export default UploadLayout;
