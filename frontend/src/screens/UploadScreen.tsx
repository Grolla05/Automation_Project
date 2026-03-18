import { useNavigate, Navigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import UploadLayout from '../components/UploadLayout';

/**
 * UploadScreen — Rota `/upload`
 *
 * Guard: redireciona para `/` se o usuário chegar aqui sem ter
 * selecionado um setor (ex: acesso direto pela URL).
 */
const UploadScreen = () => {
  const navigate = useNavigate();
  const { session, setFiles } = useSession();

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (!session.sector || session.tests.length === 0) {
    return <Navigate to="/" replace />;
  }

  const handleNext = (files: File[]) => {
    setFiles(files);
    navigate('/process');
  };

  return (
    <UploadLayout
      sessionData={{
        sector: session.sector,
        testType: session.testType,
        tests: session.tests,
      }}
      onNext={handleNext}
      onBack={() => navigate('/')}
    />
  );
};

export default UploadScreen;
