const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  scanLocalFolder: (folderPath) => ipcRenderer.invoke('fs:scanFolder', folderPath),
  writeLocalFile: (folderPath, filename, buffer) => 
    ipcRenderer.invoke('fs:writeFile', { folderPath, filename, buffer }),
  readLocalFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
});