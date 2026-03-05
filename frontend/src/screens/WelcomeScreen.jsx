import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { ChevronDown, Check } from 'lucide-react';

const SECTOR_DATA = {
  "P3 - EMC/RF": [
    "Bluetooth Low Energy",
    "Wi-Fi 2.4Ghz",
    "Wi-Fi 5Ghz",
    "DFS/TPC"
  ],
  "P4 - MED": [
    "Tensão Suportável",
    "Corrente de Fuga",
    "Resistência de Isolamento",
    "Componentes Críticos"
  ],
  "TESTE": [
    "TESTE",
  ]
};

const WelcomeScreen = ({ onNext, userData }) => {
  const [selectedSector, setSelectedSector] = useState("");
  const [selectedTests, setSelectedTests] = useState([]);

  const handleSectorChange = (e) => {
    setSelectedSector(e.target.value);
    setSelectedTests([]); // Reset tests when sector changes
  };

  const toggleTest = (test) => {
    setSelectedTests(prev => 
      prev.includes(test) 
        ? prev.filter(t => t !== test) 
        : [...prev, test]
    );
  };

  const availableTests = selectedSector ? SECTOR_DATA[selectedSector] : [];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center min-h-[80vh] w-full px-4"
    >
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-apple-text tracking-tight mb-2">
          Olá, {userData?.name || "Engenheiro"}
        </h1>
        <p className="text-apple-secondary text-lg">Selecione o setor para visualizar os ensaios disponíveis.</p>
      </div>

      <Card>
        <div className="space-y-8">
          {/* Sector Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-apple-secondary uppercase tracking-wider">Setor</label>
            <div className="relative">
              <select 
                value={selectedSector}
                onChange={handleSectorChange}
                className="w-full appearance-none bg-apple-bg border border-apple-gray rounded-apple px-4 py-3 text-apple-text focus:outline-none focus:ring-2 focus:ring-apple-blue/20 transition-all cursor-pointer"
              >
                <option value="" disabled>Selecione o setor...</option>
                {Object.keys(SECTOR_DATA).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-apple-secondary pointer-events-none" size={20} />
            </div>
          </div>

          <AnimatePresence>
            {selectedSector && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden"
              >
                <label className="text-sm font-semibold text-apple-secondary uppercase tracking-wider">
                  {selectedSector === "P3 - EMC/RF" || selectedSector === "P4 - MED" ? "Em Breve" : "Ensaios Disponíveis"}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableTests.map(test => {
                    const isDisabled = selectedSector === "P3 - EMC/RF" || selectedSector === "P4 - MED";
                    return (
                      <motion.div 
                        key={test}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={() => !isDisabled && toggleTest(test)}
                        className={`
                          flex items-center justify-between px-4 py-3 rounded-apple border transition-all
                          ${isDisabled 
                            ? "opacity-40 cursor-not-allowed border-apple-gray bg-apple-gray/10 text-apple-secondary grayscale shadow-none" 
                            : "cursor-pointer"}
                          ${!isDisabled && selectedTests.includes(test) 
                            ? "border-apple-blue bg-apple-blue/10 text-apple-blue ring-1 ring-apple-blue shadow-[0_0_15px_rgba(0,113,227,0.1)]" 
                            : !isDisabled ? "border-apple-gray bg-apple-bg hover:border-apple-secondary/30 text-apple-text" : ""}
                        `}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{test}</span>
                          {isDisabled && <span className="text-[10px] uppercase tracking-tighter opacity-70">Indisponível</span>}
                        </div>
                        {selectedTests.includes(test) && !isDisabled && <Check size={18} />}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-4 flex justify-end">
            <Button 
              disabled={!selectedSector || selectedTests.length === 0}
              onClick={() => onNext({ sector: selectedSector, tests: selectedTests })}
              className="w-full md:w-auto px-12"
            >
              Próximo
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default WelcomeScreen;
