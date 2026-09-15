@echo off
title Desinstalador de Lumcards
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0uninstall.ps1"
if errorlevel 1 (
    echo.
    echo Ocurrio un problema durante la desinstalacion.
    pause
)
