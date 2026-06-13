# Carnet de Recettes Personnel - Guide de Développement

Ce guide explique comment configurer, lancer et tester l'application en mode développement.

## Prérequis

- **Node.js** installé sur votre machine.
- Installation des dépendances (si ce n'est pas déjà fait) :
  ```bash
  npm install
  ```

## Démarrage rapide (Développement)

Pour faire fonctionner l'ensemble de l'application (frontend + fonctionnalités d'import/traduction), vous devez lancer deux terminaux.

### 1. Démarrer le Front-End (Vite)
Dans le premier terminal :
```bash
npm run dev
```
*Le site sera disponible sur [http://localhost:5173](http://localhost:5173).*

### 2. Démarrer le Back-End (API de scraping/traduction)
Dans le second terminal :
```bash
npm start
```
*L'API démarrera sur [http://localhost:3001](http://localhost:3001).*

---

## Autres Commandes Utiles

### Tester la version de production localement
Si vous souhaitez compiler et tester l'application dans les conditions réelles de production :
```bash
# Compiler le frontend
npm run build

# Lancer le serveur de production (sert le frontend sur le port 3000 et l'API sur 3001)
npm start
```

### Script de vérification automatique (Puppeteer)
Un script de test automatique vérifie la présence d'erreurs dans la console du navigateur au chargement du site :
1. Assurez-vous que le serveur de dev tourne (`npm run dev`).
2. Exécutez le script dans un terminal séparé :
   ```bash
   node check.js
   ```

---

## Structure du Projet

- `src/` : Code source du Front-End (composants React, style CSS, logique).
- `api/` : Code source du Back-End (Express server, scraping Puppeteer, API de traduction).
- `check.js` : Script de test d'intégration/vérification de non-régression.
