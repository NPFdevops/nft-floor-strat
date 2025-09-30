import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { posthogService } from './services/posthogService.js'

// Initialize PostHog
posthogService.init();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/nftstrategies" element={<App />} />
        <Route path="/nftstrategies/:strategyName" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
