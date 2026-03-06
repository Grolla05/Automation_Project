import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { api } from '../services/api';

const UploadScreen = ({ sessionData, onNext, onBack }) => {
  const [files, setFiles] = useState([]);
  const [isHovering, setIsHovering] = useState(false);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const handleProcessClick = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      await api.checkLayout(sessionData?.tests || []);
      onNext(files);
    } catch (err) {
      setError(err.message || "não há layout cadastrado para este Ensaio");
      setTimeout(() => setError(null), 4000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles) => {
    setError(null);
    let hasInvalid = false;
    
    const validFiles = newFiles.filter(file => {
      const isValid = file.type === "image/png" || 
                     file.type === "image/jpeg" || 
                     file.type === "application/pdf";
      if (!isValid) hasInvalid = true;
      return isValid;
    });

    if (hasInvalid) {
      setError("Tipo de arquivo não suportado. Use apenas PNG, JPG ou PDF.");
      // Auto-clear error after 4 seconds
      setTimeout(() => setError(null), 4000);
    }

    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsHovering(true);
  };

  const handleDragLeave = () => {
    setIsHovering(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsHovering(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col items-center justify-center min-h-[80vh] w-full px-4"
    >
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-apple-text tracking-tight mb-2">Upload de Arquivos</h1>
        <p className="text-apple-secondary text-lg">Selecione imagens (PNG/JPG) ou arquivos PDF.</p>
      </div>

      <Card className="max-w-3xl">
        <div className="space-y-6">
          {/* Dropzone Area */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
            className={twMerge(
              "relative border-2 border-dashed rounded-apple-lg p-12 flex flex-col items-center justify-center transition-all cursor-pointer",
              isHovering 
                ? "border-apple-blue bg-apple-blue/5 scale-[1.01]" 
                : "border-apple-gray bg-apple-bg hover:border-apple-secondary/50",
              error && "border-red-500 bg-red-50 dark:bg-red-500/10"
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
                accept=".jpg,.jpeg,.png,.pdf"
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <div className={twMerge(
                "w-16 h-16 rounded-full shadow-apple flex items-center justify-center mb-4 transition-colors",
                error ? "bg-red-500 text-white" : "bg-white dark:bg-apple-gray text-apple-blue"
              )}>
                <Upload size={28} />
              </div>
              <p className={twMerge("font-medium text-lg transition-colors", error ? "text-red-500" : "text-apple-text")}>
                {error ? "Arquivo inválido!" : "Arraste arquivos aqui"}
              </p>
              <p className={twMerge("text-sm mt-1 transition-colors", error ? "text-red-400" : "text-apple-secondary")}>
                {error ? "Use apenas Imagens ou PDF" : "ou clique para navegar"}
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
                      {file.type === "application/pdf" ? (
                        <FileText size={18} className="text-red-500" />
                      ) : (
                        <ImageIcon size={18} className="text-apple-secondary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-apple-text truncate max-w-[200px] md:max-w-xs">{file.name}</p>
                      <p className="text-[10px] text-apple-secondary uppercase tracking-wider">
                        {file.type === "application/pdf" ? "Documento PDF" : "Imagem"} • {(file.size / 1024).toFixed(1)} KB
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
          <div className="flex justify-between items-center pt-4">
            <Button variant="ghost" onClick={onBack} disabled={isProcessing}>Voltar</Button>
            <Button 
              disabled={files.length === 0 || isProcessing}
              onClick={handleProcessClick}
              className="px-12"
            >
              {isProcessing ? "Verificando..." : `Processar ${files.length > 0 ? `(${files.length})` : ''}`}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default UploadScreen;
