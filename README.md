# 🍳 Carnet de Recettes

Une application moderne (PWA) pour centraliser, organiser et importer facilement vos recettes de cuisine depuis le web ou vos vidéos préférées.

---

## ✨ Fonctionnalités

- 📖 **Gestion de recettes** : Visualisation sous forme de fiches ou vue livre de cuisine ("Cookbook"), recherche instantanée par titre ou ingrédient, filtrage par catégorie ou auteur.
- 🌐 **Importation automatique** :
  - Depuis n'importe quel site web (Marmiton, 750g, BBC Food, AllRecipes...) avec détection JSON-LD et Puppeteer en fallback.
  - Depuis TikTok (extraction automatique d'ingrédients et étapes depuis la description).
- 🤖 **IA & Traduction** :
  - Traduction multilingue automatique (FR ↔ EN).
  - Proxy sécurisé côté serveur pour l'API Gemini.
- ⚡ **PWA & Offline** :
  - Fonctionne hors-ligne grâce au Service Worker et à la persistance Firebase Firestore.
  - Installable sur mobile et bureau.
- 🎨 **Design Soigné** : Thème clair / sombre automatique, typographie League Gothic & Inter.

---

## 🚀 Démarrage rapide

### Prérequis
- [Node.js](https://nodejs.org) (v18 ou supérieur)

### Installation
```bash
npm install
```

### Configuration
Copiez le fichier `.env.example` en `.env` :
```bash
cp .env.example .env
```
Renseignez optionnellement votre clé `GEMINI_API_KEY` dans le fichier `.env`.

### Lancer l'application
- **Sous Windows** : Double-cliquez sur `scripts/start.bat` ou lancez `npm start`
- **Sous macOS / Linux** : Lancez `./scripts/start.sh` ou `npm start`

L'application s'ouvre automatiquement sur : **`http://localhost:3001`**

---

## 📁 Architecture du projet

```
carnet-recettes/
├── firestore.rules       # Règles de sécurité Firebase Firestore
├── package.json          # Dépendances et scripts npm
├── .env.example          # Gabarit des variables d'environnement
├── scripts/              # Scripts de démarrage et migration
│   ├── start.bat         # Lanceur Windows
│   ├── start.sh          # Lanceur macOS/Linux
│   └── migrate-categories.js # Migration des catégories dans Firestore
├── server/               # Backend Express & Puppeteer
│   └── index.js          # Serveur unique (API + statiques)
└── public/               # Application Web (Front-end PWA)
    ├── index.html        # Point d'entrée HTML
    ├── manifest.json     # Manifeste PWA
    ├── sw.js             # Service Worker
    ├── logo.png          # Logo de l'application
    ├── icons/            # Icônes de l'application
    ├── css/              # Feuilles de styles modulaires
    └── js/               # Modules ES (logique applicative)
```

---

## 🔒 Sécurité

- Aucune clé API sensible n'est transmise dans l'URL.
- Le serveur vérifie rigoureusement les protocoles (`http:`, `https:`) et bloque les adresses IP privées/locales pour prévenir toute attaque SSRF.
- Les requêtes d'écriture dans Firestore sont sécurisées avec `firestore.rules`.
