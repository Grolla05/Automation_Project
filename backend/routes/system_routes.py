import os
import subprocess
import base64
import json
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from utils.logger_config import setup_logger
from config_loader import config

logger = setup_logger()
system_bp = Blueprint('system', __name__)

EXPORT_FOLDER = config.EXPORT_FOLDER
SETTINGS_PATH = os.path.join('storage', 'user_settings.json')
FRONTEND_LIB_SETTINGS = os.path.join('..', 'frontend', 'src', 'lib', 'user_settings.json')

def get_windows_profile_picture():
    try:
        cmd = [
            "powershell", "-NoProfile", "-Command",
            "(Get-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\AccountPicture\\Users\\*' | Select-Object -ExpandProperty Image240 -ErrorAction SilentlyContinue) | Select-Object -First 1"
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True, creationflags=0x08000000)
        img_path = result.stdout.strip()
        if img_path and os.path.exists(img_path):
            with open(img_path, "rb") as image_file:
                encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
                return f"data:image/jpeg;base64,{encoded_string}"
    except Exception as e:
        logger.error(f"Erro ao obter foto de perfil: {str(e)}")
    return None

def get_windows_username():
    try:
        cmd = ["powershell", "-NoProfile", "-Command", "(Get-WmiObject -Class Win32_UserAccount -Filter \"Name='$env:USERNAME' and Domain='$env:USERDOMAIN'\").FullName"]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True, creationflags=0x08000000)
        fullname = result.stdout.strip()
        if fullname: return fullname
        cmd_fallback = ["powershell", "-NoProfile", "-Command", "$env:USERNAME"]
        res_fallback = subprocess.run(cmd_fallback, capture_output=True, text=True, check=True, creationflags=0x08000000)
        return res_fallback.stdout.strip() or "Engenheiro"
    except Exception as e:
        logger.error(f"Erro ao obter usuário: {str(e)}")
        return "Engenheiro"

@system_bp.route('/')
def serve_frontend():
    from flask import current_app
    if os.path.exists(current_app.static_folder):
        return send_from_directory(current_app.static_folder, 'index.html')
    return "Frontend não compilado. Rode 'npm run build'."

@system_bp.route('/api/user/info', methods=['GET'])
def get_user_info():
    username = get_windows_username()
    picture = get_windows_profile_picture()
    return jsonify({"name": username, "picture": picture})

@system_bp.route('/api/settings', methods=['GET', 'POST'])
def handle_settings():
    settings_path = os.path.abspath(SETTINGS_PATH)
    dev_path = os.path.abspath(FRONTEND_LIB_SETTINGS)

    if request.method == 'GET':
        if os.path.exists(settings_path):
            with open(settings_path, 'r', encoding='utf-8') as f:
                return jsonify(json.load(f))
        return jsonify({"theme": "light"})
    else:
        settings = request.json
        for path in [settings_path, dev_path]:
            try:
                os.makedirs(os.path.dirname(path), exist_ok=True)
                with open(path, 'w', encoding='utf-8') as f:
                    json.dump(settings, f, indent=2, ensure_ascii=False)
            except: continue
        return jsonify({"success": True})
