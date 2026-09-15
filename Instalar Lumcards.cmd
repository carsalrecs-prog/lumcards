@echo off
title Instalador de Lumcards
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0installer.ps1"
if errorlevel 1 (
    echo.
    echo Ocurrio un error durante la instalacion.
    pause
)
