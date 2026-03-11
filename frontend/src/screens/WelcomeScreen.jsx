import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { ChevronDown, Check } from 'lucide-react';

import { SECTOR_DATA } from '../lib/data';

const WelcomeScreen = ({ onNext, userData }) => {
  const [selectedSector, setSelectedSector] = useState("");
  const [selectedTestType, setSelectedTestType] = useState("");
  const [selectedTests, setSelectedTests] = useState([]);

  const handleSectorChange = (e) => {
    setSelectedSector(e.target.value);
    setSelectedTestType("");
    setSelectedTests([]); // Reset tests when sector changes
  };

  const handleTestTypeChange = (e) => {
    setSelectedTestType(e.target.value);
    setSelectedTests([]); // Reset tests when test type changes
  };

  const toggleTest = (test) => {
    setSelectedTests(prev => 
      prev.includes(test) 
        ? prev.filter(t => t !== test) 
        : [...prev, test]
    );
  };

  const availableTestTypes = selectedSector ? Object.keys(SECTOR_DATA[selectedSector]) : [];
  const availableTests = selectedTestType ? SECTOR_DATA[selectedSector][selectedTestType].flat() : [];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="flex flex-col items-center justify-center min-h-[80vh] w-full px-4"
    >
      <div className="text-center mb-10 flex flex-col items-center">
        {/* Shared Logo Transition */}
        <motion.div
          className={`w-24 h-24 md:w-32 md:h-32 mb-8 bg-white rounded-full flex items-center justify-center border border-apple-gray relative group ${
            userData?.picture ? "p-0 overflow-hidden" : "p-4 md:p-6"
          }`}
        >
          {/* Subtle Brush Glow */}
          <div className="absolute inset-0 rounded-full blur-xl transition-colors duration-500" />
          
          {userData?.picture ? (
            <img 
              src={userData.picture} 
              alt="User Avatar" 
              className="w-full h-full object-cover rounded-full relative z-10"
            />
          ) : (
            <img 
              src="/Logo.jpg" 
              alt="Logo" 
              className="w-full h-auto object-contain relative z-10"
            />
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-apple-text tracking-tight mb-2 text-center">
            Olá, {userData?.name || "Técnico"}
          </h1>
          <p className="text-apple-secondary text-lg text-center">Selecione o tópico para visualizar os ensaios disponíveis.</p>
        </motion.div>
      </div>

      <Card>
        <div className="space-y-8">
          {/* Sector Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-apple-secondary uppercase tracking-wider">tópico</label>
            <div className="relative">
              <select 
                value={selectedSector}
                onChange={handleSectorChange}
                className="peer w-full appearance-none bg-apple-bg/50 border-2 border-transparent hover:border-apple-gray rounded-apple px-4 py-3.5 text-apple-text font-medium focus:bg-transparent focus:text-apple-blue focus:outline-none focus:border-apple-blue focus:ring-4 focus:ring-apple-blue/30 transition-all duration-300 cursor-pointer shadow-sm"
              >
                <option value="" disabled>Selecione o tópico...</option>
                {Object.keys(SECTOR_DATA).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-apple-secondary peer-focus:text-apple-blue transition-colors duration-300 pointer-events-none" size={20} />
            </div>
          </div>

          <AnimatePresence>
            {selectedSector && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden p-1"
              >
                <label className="text-sm font-semibold text-apple-secondary uppercase tracking-wider">subtópico</label>
                <div className="relative">
                  <select 
                    value={selectedTestType}
                    onChange={handleTestTypeChange}
                    className="peer w-full appearance-none bg-apple-bg/50 border-2 border-transparent hover:border-apple-gray rounded-apple px-4 py-3.5 text-apple-text font-medium focus:bg-transparent focus:text-apple-blue focus:outline-none focus:border-apple-blue focus:ring-4 focus:ring-apple-blue/30 transition-all duration-300 cursor-pointer shadow-sm"
                  >
                    <option value="" disabled>Selecione o subtópico...</option>
                    {availableTestTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-apple-secondary peer-focus:text-apple-blue transition-colors duration-300 pointer-events-none" size={20} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {selectedTestType && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden mt-4"
              >
                <label className="text-sm font-semibold text-apple-secondary uppercase tracking-wider px-1">
                  Itens para {selectedTestType}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-1">
                  {availableTests.map(test => {
                    const isDisabled = !["TESTE", "TESTE1", "TESTE2"].includes(test); // Demo restriction
                    return (
                      <motion.div 
                        key={test}
                        layout
                        initial={{ scale: 0.95, opacity: 0, y: 15 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        whileHover={!isDisabled ? { scale: 1.02, y: -2 } : {}}
                        whileTap={!isDisabled ? { scale: 0.98 } : {}}
                        transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
                        onClick={() => !isDisabled && toggleTest(test)}
                        className={`
                          flex items-center justify-between px-5 py-3.5 rounded-xl border-2 transition-colors duration-300 relative overflow-hidden group
                          ${isDisabled 
                            ? "opacity-40 cursor-not-allowed border-apple-gray bg-apple-gray/10 text-apple-secondary grayscale" 
                            : "cursor-pointer bg-white"}
                          ${!isDisabled && selectedTests.includes(test) 
                            ? "border-apple-blue bg-apple-blue/5 text-apple-blue shadow-[0_8px_16px_rgba(0,113,227,0.12)]" 
                            : !isDisabled ? "border-transparent bg-apple-bg/60 hover:border-apple-gray hover:bg-white hover:shadow-sm text-apple-text" : ""}
                        `}
                      >
                        {/* Selected background glow */}
                        {!isDisabled && selectedTests.includes(test) && (
                          <div className="absolute inset-0 bg-gradient-to-r from-apple-blue/0 via-apple-blue/5 to-apple-blue/0 pointer-events-none" />
                        )}

                        <div className="flex flex-col relative z-10">
                          <span className={`font-semibold ${selectedTests.includes(test) ? "text-apple-blue" : ""}`}>
                            {test}
                          </span>
                          {isDisabled && <span className="text-[10px] uppercase tracking-tighter opacity-70">Indisponível</span>}
                        </div>
                        
                        {/* Animated Check */}
                        <AnimatePresence>
                          {selectedTests.includes(test) && !isDisabled && (
                            <motion.div
                              initial={{ scale: 0, rotate: -45, opacity: 0 }}
                              animate={{ scale: 1, rotate: 0, opacity: 1 }}
                              exit={{ scale: 0, rotate: 45, opacity: 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 25 }}
                              className="relative z-10 bg-apple-blue rounded-full p-1"
                            >
                              <Check size={14} className="text-white stroke-[3]" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {(selectedTestType && selectedTests.length > 0) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="pt-6 flex justify-end"
              >
                <Button 
                  variant="blue"
                  disabled={!selectedTestType || selectedTests.length === 0}
                  onClick={() => onNext({ sector: selectedSector, testType: selectedTestType, tests: selectedTests })}
                  className="w-full md:w-auto px-12 py-3.5 text-lg"
                >
                  Próximo Explorador
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
};

export default WelcomeScreen;
