import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from '../components/ui/Card';
import { api } from '../services/api';

const LoadingScreen = ({ sessionData, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Iniciando processamento...");

  useEffect(() => {
    let timer;
    let isMounted = true;

    const processBackend = async () => {
      try {
        // Start backend processing
        const result = await api.processImages(sessionData.sector, sessionData.tests, sessionData.files);
        
        // Once completed, fast-forward progress to 100% if it isn't already
        if (isMounted) {
          setProgress(100);
          setStatus("Finalizando relatório...");
          setTimeout(() => onComplete(result), 800);
        }
      } catch (err) {
        if (isMounted) {
          setStatus("Erro no processamento.");
          console.error("OCR API error:", err);
        }
      }
    };

    const runFakeProgress = () => {
      const intervals = [
        { threshold: 30, text: "Processando OCR em imagens..." },
        { threshold: 60, text: "Extraindo dados técnicos..." },
        { threshold: 85, text: "Formatando documento Word..." }
      ];

      timer = setInterval(() => {
        setProgress(prev => {
          // If we hit 90%, we hold until backend finishes
          if (prev >= 90) return 90;
          
          const next = prev + (Math.random() * 8);
          
          const currentStatus = intervals.find(i => next <= i.threshold);
          if (currentStatus) setStatus(currentStatus.text);

          return next;
        });
      }, 500);
    };

    runFakeProgress();
    processBackend();

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [onComplete, sessionData]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="flex flex-col items-center justify-center min-h-[80vh] w-full px-4"
    >
      <Card className="max-w-md">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="relative w-full h-2 bg-apple-gray rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeInOut", duration: 0.5 }}
              className="absolute top-0 left-0 h-full bg-apple-blue shadow-[0_0_10px_rgba(0,113,227,0.5)]"
            />
          </div>
          
          <div className="flex flex-col items-center space-y-2">
            <span className="text-4xl font-bold text-apple-text tracking-tighter">
              {Math.min(100, Math.round(progress))}%
            </span>
            <p className="text-apple-secondary font-medium animate-pulse">
              {status}
            </p>
          </div>

          <div className="pt-4">
            <div className="flex space-x-2">
              {[0, 1, 2].map(i => (
                <motion.div 
                  key={i}
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 1, 0.3] 
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 1.5, 
                    delay: i * 0.2 
                  }}
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
