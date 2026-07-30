@echo off
chcp 65001 >nul
title Carnet de Recettes — Serveur local
echo.
echo  🍳 Démarrage du serveur Carnet de Recettes...
echo.
cd /d "%~dp0"

where node >nul 2>&1
if %errorlevel% neq 0 (
  echo  ❌ Node.js n'est pas installé.
  echo  Téléchargez-le sur https://nodejs.org
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo  📦 Installation des dépendances...
  call npm install
  echo.
)

echo  🌐 Ouverture de l'application sur http://localhost:3000...
start "" "http://localhost:3000"
echo.

node server.js
pause

