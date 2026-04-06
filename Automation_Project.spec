# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['backend/run_desktop.py'],
    pathex=[],
    binaries=[],
    datas=[('backend/storage', 'storage'), ('frontend/dist', 'frontend/dist')],
    hiddenimports=['clr'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='Automation_Project',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

import shutil
import os

dist_path = 'dist/Automation_Project'
desktop_path = 'Desktop'

if os.path.exists(dist_path):
    if not os.path.exists(desktop_path):
        os.makedirs(desktop_path)
    # Se for um diretório (onedir), copia o conteúdo. Se for um arquivo (onefile), move o arquivo.
    if os.path.isdir(dist_path):
        shutil.copytree(dist_path, os.path.join(desktop_path, 'Automation_Project'), dirs_exist_ok=True)
    else:
        shutil.copy2(dist_path, desktop_path)
    print(f"Build copiado para {desktop_path}")

