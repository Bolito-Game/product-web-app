import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App.jsx';
import './styles/main.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* WRAP <App /> with the BrowserRouter to provide routing context */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);