const { app, BrowserWindow } = require('electron');
const { spawn, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

let pythonProcess;

function ensureEnv() {
    const envPath = path.join(__dirname, '..', '.env');
    let config = {};
    if (fs.existsSync(envPath)) {
        config = dotenv.parse(fs.readFileSync(envPath));
    }
    if (!config.OPENAI_API_KEY || !config.CLAIMS_FILE_PATH || !config.OPENAI_MODEL) {
        const script = path.join(__dirname, '..', 'configure_env.py');
        spawnSync('python', [script], { stdio: 'inherit' });
    }
}

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
    });

    const indexPath = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
    mainWindow.loadFile(indexPath);
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
}

app.whenReady().then(() => {
    ensureEnv();
    const exeName = process.platform === 'win32' ? 'run_api.exe' : 'run_api';
    const exePath = path.join(__dirname, 'backend', exeName);
    pythonProcess = spawn(exePath, [], {
        stdio: 'ignore',
        detached: true,
    });
    pythonProcess.unref();

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (pythonProcess) {
        pythonProcess.kill();
    }
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
