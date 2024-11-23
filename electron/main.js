import { app, BrowserWindow } from 'electron';
import { setupExpressServer } from '../server/express.js';
import WindowManager from './window-manager.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
const windowManager = new WindowManager();

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  //mainWindow.loadFile(path.join(__dirname, '../index.html'));
  mainWindow.loadURL('http://localhost:3000');
  mainWindow.on('closed', () => {
    windowManager.closeAll();
    app.quit();
  });
}

app.whenReady().then(() => {
  createMainWindow();
  setupExpressServer(windowManager);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});