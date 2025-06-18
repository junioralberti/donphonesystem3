// main.js
require('dotenv').config(); // Carrega as variáveis do .env

const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process'); // Importa 'spawn' para iniciar o processo Next.js
const isDev = !app.isPackaged; // Verifica se o aplicativo está em modo de desenvolvimento ou empacotado

let mainWindow;
let nextProcess; // Variável para armazenar o processo do servidor Next.js

// Define a porta do Next.js para 9003.
const NEXT_PORT = process.env.NEXT_PORT || 9003;
const NEXT_URL = `http://localhost:${NEXT_PORT}`;

// Função auxiliar para verificar se uma porta já está em uso
// Útil em desenvolvimento para evitar o erro EADDRINUSE
async function isPortInUse(port) {
  return new Promise((resolve) => {
    const net = require('net'); // Importa o módulo 'net' para verificar portas
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
    width: 1024, // Largura da janela
    height: 768, // Altura da janela
    minWidth: 800, // Largura mínima
    minHeight: 600, // Altura mínima
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, // ESSENCIAL PARA SEGURANÇA: Desabilita acesso direto ao Node.js no frontend
      contextIsolation: true, // ESSENCIAL PARA SEGURANÇA: Isola o contexto do preload
      // Desabilita a segurança web em dev apenas se necessário para problemas de CORS do Next.js
      // Lembre-se: em produção, a segurança web deve estar habilitada!
      webSecurity: !isDev
    },
    // Ícone da janela no Windows (barra de tarefas, Alt+Tab)
    icon: path.join(__dirname, 'build/icon.ico') // Caminho para o seu ícone
  });

  // Carrega a URL do servidor Next.js
  mainWindow.loadURL(NEXT_URL);

  // Opcional: Abre as ferramentas de desenvolvedor em modo de desenvolvimento
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

// Função para iniciar o servidor Next.js como um processo filho
function startNextServer() {
  // Caminho para o servidor Next.js no modo standalone (gerado por `next build`)
  const nextServerPath = path.join(app.getAppPath(), '.next', 'standalone', 'server.js');

  console.log(`Tentando iniciar servidor Next.js em: ${nextServerPath}`);

  // Inicia o processo Node.js que executa o servidor Next.js
  nextProcess = spawn(process.execPath, [nextServerPath], {
    env: { ...process.env, PORT: NEXT_PORT }, // Passa a porta para o Next.js
    cwd: path.join(app.getAppPath(), '.next', 'standalone'), // Define o diretório de trabalho
    stdio: 'inherit' // Redireciona a saída do Next.js para o console do Electron
  });

  nextProcess.on('error', (err) => {
    console.error('Erro ao iniciar o processo Next.js:', err);
    dialog.showErrorBox('Erro', 'Não foi possível iniciar o servidor Next.js.');
    app.quit(); // Sai do aplicativo se o Next.js não puder iniciar
  });

  nextProcess.on('exit', (code) => {
    console.log(`Processo Next.js finalizado com código ${code}`);
  });
}

// Função para verificar se o servidor Next.js está online
function checkNextServer(callback) {
  const http = require('http'); // Usa o módulo 'http' para fazer uma requisição simples
  const request = http.get(NEXT_URL, (res) => {
    if (res.statusCode === 200) {
      callback(true); // Servidor respondeu com sucesso
    } else {
      callback(false); // Servidor respondeu, mas com erro
    }
  });
  request.on('error', () => callback(false)); // Servidor não respondeu
  request.end();
}

// Este método será chamado quando o Electron terminar a inicialização
app.whenReady().then(async () => {
  // Em modo de desenvolvimento, o script `npm run dev` já iniciará o Next.js.
  // Em modo de produção (aplicativo empacotado), o Electron precisa iniciá-lo.
  if (!isDev) {
    startNextServer(); // Inicia o servidor Next.js
    
    // Aguarda o servidor Next.js ficar pronto antes de criar a janela
    let retries = 0;
    const maxRetries = 20; // Tenta por até 20 segundos (20 * 1000ms)
    const retryInterval = 1000; // Tenta a cada 1 segundo

    while (retries < maxRetries) {
      if (await new Promise(resolve => checkNextServer(resolve))) {
        console.log('Servidor Next.js pronto.');
        break; // Sai do loop se o servidor estiver pronto
      }
      console.log(`Aguardando servidor Next.js... Tentativa ${retries + 1}/${maxRetries}`);
      await new Promise(resolve => setTimeout(resolve, retryInterval)); // Espera
      retries++;
    }

    if (retries === maxRetries) {
      dialog.showErrorBox('Erro', 'O servidor Next.js não respondeu a tempo. O aplicativo será encerrado.');
      app.quit(); // Encerra o aplicativo se o Next.js não iniciar
      return;
    }
  }

  createWindow(); // Cria a janela do Electron

  // Em macOS, é comum recriar uma janela quando o ícone do dock é clicado
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Fecha o aplicativo quando todas as janelas são fechadas (exceto no macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') { // 'darwin' é o nome da plataforma para macOS
    app.quit();
  }
});

// Garante que o servidor Next.js seja encerrado antes que o Electron saia
app.on('before-quit', () => {
  if (nextProcess) {
    console.log('Encerrando processo Next.js...');
    nextProcess.kill(); // Envia um sinal para encerrar o processo filho
  }
});