const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('nuiStudio', {
  exportResource: (payload) => ipcRenderer.invoke('export-resource', payload)
});