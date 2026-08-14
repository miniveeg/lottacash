import './polyfills'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { WalletContextProvider } from './contexts/WalletContext'
import './styles/global.css'
import './styles/responsive-extra.css'
import './styles/review-polish.css'
import './styles/agent-pass.css'
import './styles/fees.css'
import './styles/auto-sign.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <WalletContextProvider>
        <App />
      </WalletContextProvider>
    </BrowserRouter>
  </React.StrictMode>,
)