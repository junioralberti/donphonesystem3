// main.js
require('dotenv').config(); // Carrega as variáveis do .env

const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process'); // Importa 'spawn' para iniciar o processo Next.js
const fs = require('fs'); // <--- ESSA LINHA PRECISA ESTAR AQUI!
const isDev = !app.isPackaged; // Verifica se o aplicativo está em modo de desenvolvimento ou empacotado

let mainWindow;
let nextProcess; // Variável para armazenar o processo do servidor Next.js

// Define a porta do Next.js para 9003.
const NEXT_PORT = process.env.NEXT_PORT || 9003;
const NEXT_URL = `http://localhost:${NEXT_PORT}`;

// Diretório para logs no ambiente empacotado
const logDirectory = path.join(app.getPath('userData'), 'logs'); // <--- E ESSAS TAMBÉM!
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true }); // Cria o diretório de logs se não existir
}

const nextLogPath = path.join(logDirectory, 'next_server_output.log');
const nextErrorLogPath = path.join(logDirectory, 'next_server_error.log');

// Funções isPortInUse e createWindow permanecem as mesmas
async function isPortInUse(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: !isDev
    },
    icon: path.join(__dirname, 'build/icon.ico')
  });

  mainWindow.loadURL(NEXT_URL);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

// Função para iniciar o servidor Next.js como um processo filho
function startNextServer() {
  const nextServerPath = path.join(app.getAppPath(), '.next', 'standalone', 'server.js');

  // Crie os streams de arquivo para logs. 'a' para append (adicionar ao final do arquivo).
  const logFileStream = fs.openSync(nextLogPath, 'a');
  const errorLogFileStream = fs.openSync(nextErrorLogPath, 'a');

  // Escreva uma marca de tempo no início de cada execução para facilitar a depuração
  fs.writeSync(logFileStream, `\n--- Nova execução iniciada: ${new Date().toISOString()} ---\n`);
  fs.writeSync(errorLogFileStream, `\n--- Nova execução iniciada: ${new Date().toISOString()} ---\n`);


  console.log(`Tentando iniciar servidor Next.js em: ${nextServerPath}`);

  nextProcess = spawn(process.execPath, [nextServerPath], {
    env: { ...process.env, PORT: NEXT_PORT, NODE_ENV: 'production' }, // Adicionado NODE_ENV para garantir modo de produção
    cwd: path.join(app.getAppPath(), '.next', 'standalone'),
    stdio: ['inherit', logFileStream, errorLogFileStream] // <--- ESSA LINHA É CRÍTICA!
  });

  nextProcess.on('error', (err) => {
    console.error('Erro ao iniciar o processo Next.js:', err);
    // Adicione o erro ao log de erros também
    fs.writeSync(errorLogFileStream, `\nErro fatal ao iniciar processo Next.js: ${err.stack || err.message}\n`);
    dialog.showErrorBox('Erro', `Não foi possível iniciar o servidor Next.js. Verifique ${nextErrorLogPath} para mais detalhes.`);
    app.quit();
  });

  nextProcess.on('exit', (code, signal) => {
    console.log(`Processo Next.js finalizado com código ${code} e sinal ${signal}`);
    fs.writeSync(logFileStream, `\nProcesso Next.js finalizado com código ${code} e sinal ${signal}\n`);
    fs.closeSync(logFileStream);
    fs.closeSync(errorLogFileStream);
  });
}

// Função checkNextServer permanece a mesma
function checkNextServer(callback) {
  const http = require('http');
  const request = http.get(NEXT_URL, (res) => {
    if (res.statusCode === 200) {
      callback(true);
    } else {
      callback(false);
    }
  });
  request.on('error', () => callback(false));
  request.end();
}

// app.whenReady(), app.on('window-all-closed'), app.on('before-quit') permanecem as mesmas
app.whenReady().then(async () => {
  if (!isDev) {
    startNextServer();

    let retries = 0;
    const maxRetries = 20;
    const retryInterval = 1000;

    while (retries < maxRetries) {
      if (await new Promise(resolve => checkNextServer(resolve))) {
        console.log('Servidor Next.js pronto.');
        break;
      }
      console.log(`Aguardando servidor Next.js... Tentativa <span class="math-inline">\{retries \+ 1\}/</span>{maxRetries}`);
      retries++;
    }

    if (retries === maxRetries) {
      dialog.showErrorBox('Erro', `O servidor Next.js não respondeu a tempo. O aplicativo será encerrado. Verifique ${nextErrorLogPath} para detalhes.`);
      app.quit();
      return;
    }
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (nextProcess) {
    console.log('Encerrando processo Next.js...');
    nextProcess.kill();
  }
});