import React, { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUpdateStore } from '../hooks/useUpdateStore';

interface VersionData {
  version: string;
  updated_at?: string;
  description?: string;
}

const GITHUB_REPO = "Grolla05/Automation_Project";
const BRANCH = "TUV-main";
const REMOTE_VERSION_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}/${BRANCH}/version.json`;

const UpdateScreen: React.FC = () => {
  const [localVersion, setLocalVersion] = useState<string | null>(null);
  const [remoteVersion, setRemoteVersion] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [updateStatus, setUpdateStatus] = useState<string>('Aguardando...');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { hasCheckedForUpdate, setHasCheckedForUpdate } = useUpdateStore();

  // Efeito para monitorar o progresso quando isUpdating for true
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isUpdating) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get('/api/system/update/status');
          setProgress(res.data.progress);
          setUpdateStatus(res.data.status === 'baixando' ? `Baixando... ${res.data.progress}%` : res.data.status);
          
          if (res.data.progress === 100) {
            clearInterval(interval);
          }
        } catch (err) {
          console.error("Erro ao monitorar progresso");
        }
      }, 800); // Polling a cada 800ms
    }

    return () => clearInterval(interval);
  }, [isUpdating]);

  useEffect(() => {
    const checkVersions = async () => {
      // Se já verificou nesta sessão, pula direto para /welcome
      if (hasCheckedForUpdate) {
        navigate('/welcome', { replace: true });
        return;
      }

      try {
        // 1. Pega versão local do backend Flask
        const localRes = await axios.get('/api/system/version');
        setLocalVersion(localRes.data.version);

        // 2. Pega versão remota do GitHub
        const remoteRes = await axios.get(REMOTE_VERSION_URL);
        const data: VersionData = remoteRes.data;
        setRemoteVersion(data.version);

        // Se as versões forem iguais, pula para a WelcomeScreen
        if (data.version === localRes.data.version) {
          console.log("Versões iguais, redirecionando para /welcome...");
          setHasCheckedForUpdate(true);
          navigate('/welcome', { replace: true });
        }
      } catch (err) {
        console.error("Erro ao verificar versões:", err);
        // Em caso de erro (ex: sem internet), segue para o app
        setHasCheckedForUpdate(true);
        navigate('/welcome', { replace: true });
      }
    };

    checkVersions();
  }, [navigate, hasCheckedForUpdate, setHasCheckedForUpdate]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    setError(null);
    try {
      // Chama o backend Flask para iniciar o processo de atualização
      // O backend Flask por sua vez comunicará com o Launcher ou fará o download
      await axios.post('/api/system/update/start');
      
      // Opcional: O app pode fechar aqui enquanto o Launcher faz o trabalho sujo
    } catch (err) {
      setError("Falha ao iniciar atualização. Tente novamente.");
      setIsUpdating(false);
    }
  };

  const handleSkip = () => {
    navigate('/welcome', { replace: true });
  };

  if (!remoteVersion || remoteVersion === localVersion) {
    return (
      <div className="fixed inset-0 z-9999 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="animate-pulse text-slate-500 font-medium tracking-wide">
            Verificando atualizações...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-slate-50 p-4">
      <Card className="max-w-md w-full p-8 shadow-xl border-t-4 border-blue-500">
        <div className="text-center">
          <div className="text-4xl mb-4">🚀</div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            Nova Versão Disponível!
          </h1>
          <p className="text-slate-600 mb-6">
            Uma atualização importante está pronta para ser instalada.
          </p>

          <div className="bg-slate-100 rounded-lg p-4 mb-8 flex justify-around items-center">
            <div className="text-center">
              <span className="text-xs uppercase text-slate-500 block">Atual</span>
              <span className="font-mono font-bold text-slate-700">{localVersion}</span>
            </div>
            <div className="text-blue-500 text-xl">➜</div>
            <div className="text-center">
              <span className="text-xs uppercase text-slate-500 block">Nova</span>
              <span className="font-mono font-bold text-blue-600">{remoteVersion}</span>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <div className="flex flex-col gap-3">
            {isUpdating ? (
              <div className="w-full space-y-2">
                <div className="flex justify-between text-sm text-slate-500 mb-1">
                  <span>{updateStatus}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Não feche o programa. Ele será reiniciado automaticamente.
                </p>
              </div>
            ) : (
              <>
                <Button 
                  onClick={handleUpdate} 
                  disabled={isUpdating}
                  variant="blue"
                  className="w-full py-6 text-lg"
                >
                  Atualizar Agora
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={handleSkip}
                  disabled={isUpdating}
                  className="w-full text-slate-500 border-slate-200"
                >
                  Lembrar mais tarde
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UpdateScreen;
