#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/.."

echo ""
echo "🍳 Démarrage du serveur Carnet de Recettes..."
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js n'est pas installé."
  echo "Téléchargez-le sur https://nodejs.org"
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "📦 Installation des dépendances..."
  npm install
  echo ""
fi

echo "🌐 Lancement du serveur sur http://localhost:3001..."
echo ""

node server/index.js
