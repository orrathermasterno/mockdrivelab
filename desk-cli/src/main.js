import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import fs from 'node:fs';
import crypto from 'node:crypto';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
ipcMain.handle('dialog:selectFolder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  return canceled ? null : filePaths[0];
});

ipcMain.handle('fs:scanFolder', async (_, folderPath) => {
  const entries = fs.readdirSync(folderPath, { withFileTypes: true });
  return entries
    .filter(e => e.isFile() && !e.name.startsWith('.'))
    .map(e => {
      const fullPath = path.join(folderPath, e.name);
      const stat = fs.statSync(fullPath);
      const fileBuffer = fs.readFileSync(fullPath);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      return {
        name: e.name,
        path: fullPath,
        size: stat.size,
        mtime: stat.mtimeMs,
        sha256: hash
      };
    });
});

ipcMain.handle('fs:writeFile', async (_, { folderPath, filename, buffer }) => {
  const target = path.join(folderPath, filename);
  fs.writeFileSync(target, Buffer.from(buffer));
  return true;
});

ipcMain.handle('fs:readFile', async (_, filePath) => {
  const buffer = fs.readFileSync(filePath);
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength); 
});