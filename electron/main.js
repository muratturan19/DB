const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const appDataRoot = path.join(app.getPath('appData'), 'DB-App');
const envPath = path.join(appDataRoot, '.env');
const userGuidelines = path.join(appDataRoot, 'guidelines');
const userPrompts = path.join(appDataRoot, 'prompts');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyDefaultsIfNeeded(src, dest) {
  ensureDir(dest);
  if (fs.readdirSync(dest).length === 0) {
    fs.cpSync(src, dest, { recursive: true });
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    fullscreenable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  const indexPath = path.join(__dirname, 'ui', 'index.html');
  mainWindow.loadFile(indexPath);

  // Developer console'u aç (geçici debug için)
  mainWindow.webContents.openDevTools();

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

let backendProcess;

app.whenReady().then(() => {
  const guidelinesDefault = path.join(process.resourcesPath, 'guidelines-default');
  const promptsDefault = path.join(process.resourcesPath, 'prompts-default');

  copyDefaultsIfNeeded(guidelinesDefault, userGuidelines);
  copyDefaultsIfNeeded(promptsDefault, userPrompts);

  const backendExe = path.join(process.resourcesPath, 'backend', 'backend.exe');
  backendProcess = spawn(backendExe, [], {
    env: {
      ...process.env,
      ENV_FILE: envPath,
      PROMPTS_DIR: path.join(appDataRoot, 'prompts'),
    },
    stdio: ['ignore', 'pipe', 'pipe'], // Hata loglarını görmek için
    windowsHide: true,
  });

  // Hata loglarını yakala
  backendProcess.stderr.on('data', (data) => {
    console.error('Backend error:', data.toString());
  });

  backendProcess.stdout.on('data', (data) => {
    console.log('Backend output:', data.toString());
  });

  backendProcess.on('exit', (code) => {
    console.log('Backend exited with code:', code);
  });

  ipcMain.handle('guidelines:open', () => shell.openPath(userGuidelines));
  ipcMain.handle('guidelines:reset', () => {
    fs.rmSync(userGuidelines, { recursive: true, force: true });
    fs.cpSync(guidelinesDefault, userGuidelines, { recursive: true });
  });
  ipcMain.handle('prompts:open', () => shell.openPath(userPrompts));
  ipcMain.handle('prompts:reset', () => {
    fs.rmSync(userPrompts, { recursive: true, force: true });
    fs.cpSync(promptsDefault, userPrompts, { recursive: true });
  });
  ipcMain.handle('config:open', () => shell.openPath(appDataRoot));

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

