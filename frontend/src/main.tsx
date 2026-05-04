import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Suppress read-only property errors
window.addEventListener('error', (event) => {
  if (event.message.includes('Cannot assign to read only property')) {
    console.warn('Suppressed:', event.message);
    event.preventDefault();
  }
}, true);

// ⏱️ Increase fetch timeout for Render free tier (cold starts)
const originalFetch = fetch;
window.fetch = function(...args) {
  return Promise.race([
    originalFetch.apply(this, args),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout - backend may be waking up')), 60000) // 60 second timeout
    )
  ]);
};

// 🔌 Keep-Alive Service for Render Free Tier
// Prevents backend from cold-starting by pinging it periodically
const initKeepAlive = () => {
  const API_URL = 'https://smpmps-backend.onrender.com';
  
  // Initial wake-up ping
  fetch(`${API_URL}/health`, { method: 'GET' })
    .then(() => console.log('✅ Backend keep-alive: Initial ping sent'))
    .catch(() => console.log('⏳ Backend is waking up...'));
  
  // Keep pinging every 4 minutes (240000ms) to prevent cold start
  setInterval(() => {
    fetch(`${API_URL}/health`, { method: 'GET' })
      .then(() => console.log('✅ Backend keep-alive: Ping successful'))
      .catch(() => console.log('⚠️ Backend keep-alive: Ping failed (will retry)'));
  }, 240000); // 4 minutes
};

// Start keep-alive service
initKeepAlive();

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

createRoot(rootElement).render(<App />);
