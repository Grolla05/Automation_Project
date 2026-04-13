import os
import sys
import json
import requests
import subprocess
import time
import zipfile
import shutil
from pathlib import Path

# Configurações do Lançador (ajustadas para rodar da raiz do projeto)
BASE_DIR = Path(__file__).parent.parent
GITHUB_REPO = "Grolla05/Automation_Project"
BRANCH = "TUV-main"
REMOTE_VERSION_URL = f"https://raw.githubusercontent.com/{GITHUB_REPO}/{BRANCH}/version.json"
LATEST_RELEASE_URL = f"https://github.com/{GITHUB_REPO}/releases/latest/download/Automation_App.zip"
LOCAL_VERSION_FILE = BASE_DIR / "version.json"
APP_EXECUTABLE = BASE_DIR / "Automation_App.exe"
UPDATE_ZIP = BASE_DIR / "update.zip"
UPDATE_LOCK = BASE_DIR / "update.lock"
PROGRESS_FILE = BASE_DIR / "update_progress.json"

def write_progress(progress, status="updating"):
    with open(PROGRESS_FILE, "w") as f:
        json.dump({"progress": progress, "status": status}, f)

def download_update():
    try:
        write_progress(0, "iniciando")
        remote_data = requests.get(REMOTE_VERSION_URL, timeout=10).json()
        
        # Download do ZIP
        response = requests.get(LATEST_RELEASE_URL, stream=True, timeout=60)
        response.raise_for_status()
        total_size = int(response.headers.get('content-length', 0))
        
        downloaded = 0
        with open(UPDATE_ZIP, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        percent = int((downloaded / total_size) * 90) # 90% do progresso é download
                        write_progress(percent, "baixando")
        
        # Extração
        write_progress(85, "extraindo")
        temp_extract_dir = BASE_DIR / "temp_update"
        
        # Garante que o diretório temporário esteja limpo
        if os.path.exists(temp_extract_dir):
            try:
                shutil.rmtree(temp_extract_dir)
            except:
                pass
            
        with zipfile.ZipFile(UPDATE_ZIP, 'r') as zip_ref:
            zip_ref.extractall(temp_extract_dir)
        
        # Sobrescrever arquivos com tratamento de erro para Windows
        for item in os.listdir(temp_extract_dir):
            s = os.path.join(temp_extract_dir, item)
            d = os.path.join(BASE_DIR, item)
            try:
                if os.path.isdir(s):
                    if os.path.exists(d):
                        shutil.rmtree(d, ignore_errors=True)
                    shutil.copytree(s, d, dirs_exist_ok=True)
                else:
                    # Tenta remover antes de copiar para evitar conflitos de permissão
                    if os.path.exists(d):
                        os.remove(d)
                    shutil.copy2(s, d)
            except Exception as e:
                print(f"Erro ao mover {item}: {e}")
                continue
        
        # Limpeza final
        try:
            shutil.rmtree(temp_extract_dir)
            if os.path.exists(UPDATE_ZIP):
                os.remove(UPDATE_ZIP)
        except:
            pass
            
        write_progress(100, "concluido")
        with open(LOCAL_VERSION_FILE, "w", encoding="utf-8") as f:
            json.dump(remote_data, f, indent=4)
        
        if os.path.exists(UPDATE_LOCK):
            os.remove(UPDATE_LOCK)
        return True
    except Exception as e:
        write_progress(0, f"erro: {str(e)}")
        if os.path.exists(UPDATE_ZIP):
            os.remove(UPDATE_ZIP)
        return False

def launch_app():
    while True:
        if os.path.exists(PROGRESS_FILE):
             os.remove(PROGRESS_FILE)
             
        if os.path.exists(APP_EXECUTABLE):
            process = subprocess.Popen([str(APP_EXECUTABLE)])
        else:
            backend_script = BASE_DIR / "backend" / "run_desktop.py"
            process = subprocess.Popen([sys.executable, str(backend_script)])

        while process.poll() is None:
            if os.path.exists(UPDATE_LOCK):
                process.terminate()
                process.wait()
                download_update()
                break 
            time.sleep(1)
        
        if not os.path.exists(UPDATE_LOCK):
            break

if __name__ == "__main__":
    launch_app()
