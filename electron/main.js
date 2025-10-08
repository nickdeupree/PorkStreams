/* eslint-env node */
/* global process */
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  win.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  if (app.isPackaged) {
    const indexPath = path.join(__dirname, '../dist/index.html');
    win.loadFile(indexPath).catch((err) => {
      // Log to console in case something goes wrong when packaged
      console.error('Failed to load index.html from', indexPath, err);
    });
  } else {
    // Development: expect Vite dev server running on 5173
    const devUrl = 'http://localhost:5173';
    win.loadURL(devUrl).catch((err) => {
      console.error('Failed to load dev server at', devUrl, err);
    });
    // Open devtools to help debugging during development
    win.webContents.openDevTools({ mode: 'detach' });
  }
}

app.whenReady().then( () => {
  ipcMain.handle('electron-fetch', async (event, { url, options = {} }) => {
    try {
      // Use global fetch available in modern Electron/node. If unavailable,
      // this will throw and be caught below.
      const res = await fetch(url, options);
      const text = await res.text();
      const headers = {};
      try {
        for (const [k, v] of res.headers) {
          headers[k] = v;
        }
      } catch {
        // ignore header iteration errors
      }
      return { ok: res.ok, status: res.status, headers, text };
    } catch (err) {
      return { ok: false, status: 0, headers: {}, text: String(err) };
    }
  });
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
