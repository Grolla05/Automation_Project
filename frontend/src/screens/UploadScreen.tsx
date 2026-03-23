import { useNavigate, Navigate } from 'react-router-dom';
import { useWizardStore } from '../hooks/useWizardStore';
import UploadLayout from '../components/UploadLayout';

/**
 * UploadScreen — Rota `/upload`
 *
 * Guard: redireciona para `/` se o usuário chegar aqui sem ter
 * selecionado um setor (ex: acesso direto pela URL).
 */
const UploadScreen = () => {
  const navigate = useNavigate();
  const { sector, testType, tests, setFiles } = useWizardStore();

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (!sector || tests.length === 0) {
    return <Navigate to="/" replace />;
  }

  const handleNext = (files: File[]) => {
    setFiles(files);
    navigate('/process');
  };

  return (
    <UploadLayout
      onNext={handleNext}
      onBack={() => navigate('/')}
    />
  );
};

export default UploadScreen;
