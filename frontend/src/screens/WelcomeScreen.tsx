import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as Select from '@radix-ui/react-select';
import * as Checkbox from '@radix-ui/react-checkbox';
import * as Label from '@radix-ui/react-label';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { ChevronDown, Check, Search } from 'lucide-react';
import { SECTOR_DATA, TestAvailability } from '../lib/data';
import { useWizardStore } from '../hooks/useWizardStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WelcomeSelectionData {
  sector: string;
  testType: string;
  tests: string[];
}

// ─── Component ────────────────────────────────────────────────────────────────

const WelcomeScreen = () => {
  const navigate = useNavigate();
  const { userData, setSelection } = useWizardStore();

  const [selectedSector, setSelectedSector] = useState<string>('');
  const [selectedTestType, setSelectedTestType] = useState<string>('');
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleSectorChange = (value: string) => {
    setSelectedSector(value);
    setSelectedTestType('');
    setSelectedTests([]);
    setSearchTerm('');
  };

  const handleTestTypeChange = (value: string) => {
    setSelectedTestType(value);
    setSelectedTests([]);
    setSearchTerm('');
  };

  const toggleTest = (testName: string) => {
    setSelectedTests((prev) =>
      prev.includes(testName) ? prev.filter((t) => t !== testName) : [...prev, testName]
    );
  };

  const availableTestTypes: string[] = selectedSector
    ? Object.keys(SECTOR_DATA[selectedSector] ?? {})
    : [];

  const availableTests: TestAvailability[] =
    selectedSector && selectedTestType
      ? (SECTOR_DATA[selectedSector]?.[selectedTestType] ?? []).flat()
      : [];

  const filteredTests = availableTests.filter((test) =>
    test.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNext = () => {
    if (!selectedTestType || selectedTests.length === 0) return;
    setSelection(selectedSector, selectedTestType, selectedTests);
    navigate('/upload');
  };

  return (
    <motion.div
      key="welcome"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="flex flex-col items-center justify-center min-h-[80vh] w-full px-4"
    >
      <div className="text-center mb-10 flex flex-col items-center">
        {/* Avatar / Logo */}
        <motion.div
           className={`w-24 h-24 md:w-32 md:h-32 mb-8 bg-white rounded-full flex items-center justify-center border border-apple-gray relative group ${
            userData?.picture ? 'p-0 overflow-hidden' : 'p-4 md:p-6'
          }`}
        >
          <div className="absolute inset-0 rounded-full blur-xl transition-colors duration-500" />
          {userData?.picture ? (
            <img
              src={userData.picture}
              alt={`Foto de perfil de ${userData.name}`}
              className="w-full h-full object-cover rounded-full relative z-10"
            />
          ) : (
            <img
              src="/Logo_TUV.jpg"
              alt="Logo TÜV Rheinland"
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
            Olá, {userData?.name || 'Engenheiro'}
          </h1>
          <p className="text-apple-secondary text-lg text-center">
            Selecione o setor para visualizar os ensaios disponíveis.
          </p>
        </motion.div>
      </div>

      <Card>
        <div className="space-y-8">
          {/* Sector Selection */}
          <div className="space-y-3">
            <Label.Root className="text-sm font-semibold text-apple-secondary uppercase tracking-wider" htmlFor="sector-select">
              Setor
            </Label.Root>
            <Select.Root value={selectedSector} onValueChange={handleSectorChange}>
              <Select.Trigger
                id="sector-select"
                className="flex items-center justify-between w-full bg-apple-bg/50 border-2 border-transparent hover:border-apple-gray rounded-apple px-4 py-3.5 text-apple-text font-medium focus:bg-transparent focus:text-apple-blue focus:outline-none focus:border-apple-blue focus:ring-4 focus:ring-apple-blue/30 transition-all duration-300 cursor-pointer shadow-sm text-left"
                aria-label="Selecionar setor"
              >
                <Select.Value placeholder="Selecione o setor..." />
                <Select.Icon>
                  <ChevronDown className="text-apple-secondary" size={20} />
                </Select.Icon>
              </Select.Trigger>

              <Select.Portal>
                <Select.Content className="z-[200] overflow-hidden bg-white rounded-xl shadow-xl border border-apple-gray animate-in fade-in zoom-in-95 duration-200">
                  <Select.ScrollUpButton className="flex items-center justify-center h-[25px] bg-white text-apple-secondary cursor-default">
                    <ChevronDown className="rotate-180" size={16} />
                  </Select.ScrollUpButton>
                  <Select.Viewport className="p-2">
                    {Object.keys(SECTOR_DATA).map((s) => (
                      <Select.Item
                        key={s}
                        value={s}
                        className="relative flex items-center px-8 py-3 text-sm font-medium text-[#1d1d1f] rounded-lg hover:bg-apple-bg hover:text-apple-blue cursor-pointer outline-none focus:bg-apple-blue/10 focus:text-apple-blue transition-colors"
                      >
                        <Select.ItemText>{s}</Select.ItemText>
                        <Select.ItemIndicator className="absolute left-2 flex items-center justify-center">
                          <Check size={16} className="text-apple-blue" />
                        </Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                  <Select.ScrollDownButton className="flex items-center justify-center h-[25px] bg-white text-apple-secondary cursor-default">
                    <ChevronDown size={16} />
                  </Select.ScrollDownButton>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>

          <AnimatePresence>
            {selectedSector && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <Label.Root className="text-sm font-semibold text-apple-secondary uppercase tracking-wider" htmlFor="test-type-select">
                  Tipo de Ensaio
                </Label.Root>
                <Select.Root value={selectedTestType} onValueChange={handleTestTypeChange}>
                  <Select.Trigger
                    id="test-type-select"
                    className="flex items-center justify-between w-full bg-apple-bg/50 border-2 border-transparent hover:border-apple-gray rounded-apple px-4 py-3.5 text-apple-text font-medium focus:bg-transparent focus:text-apple-blue focus:outline-none focus:border-apple-blue focus:ring-4 focus:ring-apple-blue/30 transition-all duration-300 cursor-pointer shadow-sm text-left"
                    aria-label="Selecionar tipo de ensaio"
                  >
                    <Select.Value placeholder="Selecione o tipo de ensaio..." />
                    <Select.Icon>
                      <ChevronDown className="text-apple-secondary" size={20} />
                    </Select.Icon>
                  </Select.Trigger>

                  <Select.Portal>
                    <Select.Content className="z-[200] overflow-hidden bg-white rounded-xl shadow-xl border border-apple-gray animate-in fade-in zoom-in-95 duration-200">
                      <Select.Viewport className="p-2">
                        {availableTestTypes.map((t) => (
                          <Select.Item
                            key={t}
                            value={t}
                            className="relative flex items-center px-8 py-3 text-sm font-medium text-apple-text rounded-lg hover:text-apple-blue cursor-pointer outline-none focus:bg-apple-blue/10 focus:text-apple-blue transition-colors"
                          >
                            <Select.ItemText>{t}</Select.ItemText>
                            <Select.ItemIndicator className="absolute left-2 flex items-center justify-center">
                              <Check size={16} className="text-apple-blue" />
                            </Select.ItemIndicator>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {selectedTestType && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 mt-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-apple-secondary uppercase tracking-wider">
                    Itens e Ensaios para {selectedTestType}
                  </span>
                  
                  {/* Search Bar */}
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-apple-secondary" size={16} />
                    <input
                      type="text"
                      placeholder="Filtrar ensaios..."
                      aria-label="Filtrar lista de ensaios"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-apple-bg/50 border border-transparent hover:border-apple-gray focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/20 rounded-lg pl-10 pr-4 py-2 text-sm transition-all focus:outline-none"
                    />
                  </div>
                </div>

                <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-3 custom-scrollbar">
                  <legend className="sr-only">Selecione os ensaios desejados</legend>
                  {filteredTests.length > 0 ? (
                    filteredTests.map((test) => {
                      const isDisabled = !test.enabled;
                      const isChecked = selectedTests.includes(test.name);
                      
                      return (
                        <div key={test.name} className="relative group">
                          <Checkbox.Root
                            id={`test-${test.name}`}
                            disabled={isDisabled}
                            checked={isChecked}
                            onCheckedChange={() => toggleTest(test.name)}
                            className={`
                              w-full flex items-center justify-between px-5 py-3.5 rounded-xl border-2 transition-all duration-300 relative overflow-hidden text-left
                              ${isDisabled
                                ? 'opacity-40 cursor-not-allowed border-apple-gray bg-apple-gray/10 text-apple-secondary grayscale'
                                : 'cursor-pointer hover:border-apple-gray hover:bg-apple-white hover:shadow-sm'}
                              ${isChecked && !isDisabled
                                ? 'border-apple-blue bg-apple-blue/5 text-apple-blue shadow-[0_8px_16px_rgba(0,113,227,0.12)]'
                                : !isDisabled
                                  ? 'border-transparent bg-apple-bg text-apple-text'
                                  : ''}
                            `}
                          >
                            <div className="flex flex-col relative z-10">
                              <span className={`font-semibold ${isChecked ? 'text-apple-blue' : ''}`}>
                                {test.name}
                              </span>
                              {isDisabled && (
                                <span className="text-[10px] uppercase tracking-tighter opacity-70">
                                  Indisponível
                                </span>
                              )}
                            </div>
                            
                            <Checkbox.Indicator className="relative z-10 bg-apple-blue rounded-full p-1 transition-transform animate-in zoom-in duration-200">
                              <Check size={14} className="text-white stroke-[3]" />
                            </Checkbox.Indicator>
                          </Checkbox.Root>
                          
                          <Label.Root htmlFor={`test-${test.name}`} className="sr-only">
                            {test.name}
                          </Label.Root>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-8 text-center text-apple-secondary italic">
                      Nenhum ensaio encontrado para "{searchTerm}"
                    </div>
                  )}
                </fieldset>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-4">
            <Button
              onClick={handleNext}
              disabled={!selectedTestType || selectedTests.length === 0}
              className="w-full h-14 text-lg font-bold"
              aria-label="Prosseguir para o upload de arquivos"
            >
              Próximo Passo
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default WelcomeScreen;
