import * as React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import './services/i18nService'

const container = document.getElementById('root')
const root = createRoot(container!)
root.render(React.createElement(React.StrictMode, null, React.createElement(App)))