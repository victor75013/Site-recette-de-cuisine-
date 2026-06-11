import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

import './styles/theme.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';

import './styles/features/recipes/style.css';
import './styles/features/recipe-form/style.css';
import './styles/features/sites/style.css';
import './styles/features/import/style.css';
import './styles/features/settings/style.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
