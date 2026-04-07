# -*- mode: python ; coding: utf-8 -*-

import os
import shutil

# ─── Caminhos Base ─────────────────────────────────────────────────────────────
# SPECPATH → pasta onde o .spec está: Desktop/
# PROJECT_ROOT → raiz do projeto (um nível acima de Desktop/)
PROJECT_ROOT = os.path.abspath(os.path.join(SPECPATH, '..'))
DESKTOP_DIR  = SPECPATH  # Destino final do .exe

# ─── Análise ───────────────────────────────────────────────────────────────────
a = Analysis(
    [os.path.join(PROJECT_ROOT, 'backend', 'run_desktop.py')],
    pathex=[os.path.join(PROJECT_ROOT, 'backend')],
    binaries=[],
    datas=[
        (os.path.join(PROJECT_ROOT, 'backend', 'storage'), 'storage'),
        (os.path.join(PROJECT_ROOT, 'frontend', 'dist'), 'frontend/dist'),
    ],
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

# ─── Pós-build: move o .exe para Desktop/ e limpa pastas temporárias ───────────
#
#  DISTPATH  → onde o PyInstaller colocou a saída (injetado automaticamente)
#  SPECPATH  → pasta Desktop/ onde o .spec está (injetado automaticamente)
#  workpath  → pasta build/ criada pelo PyInstaller (sempre relativa ao CWD)

exe_nome    = 'Automation_Project.exe'
exe_origem  = os.path.join(DISTPATH, exe_nome)       # onde o PyInstaller gerou
exe_destino = os.path.join(DESKTOP_DIR, exe_nome)    # Desktop/Automation_Project.exe

# O PyInstaller cria build/ relativo ao diretório onde o comando foi executado
workpath = os.path.join(os.getcwd(), 'build')

print(f"\n[Post-build] DISTPATH  = {DISTPATH}")
print(f"[Post-build] workpath  = {workpath}")
print(f"[Post-build] Destino   = {exe_destino}\n")

# 1. Move o .exe para Desktop/ (só copia se ainda não estiver lá)
if os.path.exists(exe_origem):
    if os.path.abspath(exe_origem) != os.path.abspath(exe_destino):
        shutil.copy2(exe_origem, exe_destino)
        print(f"[Post-build] .exe copiado para: {exe_destino}")
    else:
        print(f"[Post-build] .exe já está em: {exe_destino}")
else:
    print(f"[Post-build] AVISO: .exe não encontrado em {exe_origem}")

# 2. Remove a pasta dist/ gerada — protege Desktop/ de ser apagado
if os.path.isdir(DISTPATH):
    if os.path.abspath(DISTPATH) != os.path.abspath(DESKTOP_DIR):
        shutil.rmtree(DISTPATH, ignore_errors=True)
        print(f"[Post-build] Pasta dist removida: {DISTPATH}")

# 3. Remove a pasta build/ (artefatos de compilação desnecessários após o build)
if os.path.isdir(workpath):
    shutil.rmtree(workpath, ignore_errors=True)
    print(f"[Post-build] Pasta build removida: {workpath}")

print(f"\n[Post-build] Concluído! Executável disponível em:\n  {exe_destino}\n")

