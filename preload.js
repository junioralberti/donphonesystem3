// preload.js
const { contextBridge } = require('electron');

// Expondo as chaves do Firebase de forma segura para o processo de renderização.
// As variáveis de ambiente são lidas do process.env que é acessível aqui no preload.
contextBridge.exposeInMainWorld('firebaseConfig', {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
});

// Se você precisar de outras APIs para se comunicar com o main process
// contextBridge.exposeInMainWorld('api', {
//   send: (channel, data) => ipcRenderer.send(channel, data),
//   receive: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args))
// });