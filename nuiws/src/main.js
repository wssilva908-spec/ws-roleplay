const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1500, height: 940, minWidth: 1120, minHeight: 720,
    backgroundColor: '#0b0f17',
    title: 'NUI Studio FiveM',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile(path.join(__dirname, 'index.html'));
}
app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

ipcMain.handle('export-resource', async (_event, payload) => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'], title: 'Escolha onde salvar a NUI' });
  if (result.canceled || !result.filePaths[0]) return { canceled: true };
  const root = path.join(result.filePaths[0], safeName(payload.resourceName || 'minha_nui'));
  const htmlDir = path.join(root, 'html');
  fs.mkdirSync(htmlDir, { recursive: true });
  fs.writeFileSync(path.join(root, 'fxmanifest.lua'), payload.manifest, 'utf8');
  fs.writeFileSync(path.join(root, 'client.lua'), payload.clientLua || '', 'utf8');
  fs.writeFileSync(path.join(htmlDir, 'index.html'), payload.html, 'utf8');
  fs.writeFileSync(path.join(htmlDir, 'style.css'), payload.css, 'utf8');
  fs.writeFileSync(path.join(htmlDir, 'app.js'), payload.js, 'utf8');
  if (payload.assets && Array.isArray(payload.assets)) {
    const assetsDir = path.join(htmlDir, 'assets');
    fs.mkdirSync(assetsDir, { recursive: true });
    for (const asset of payload.assets) {
      if (!asset.dataUrl || !asset.name) continue;
      const match = asset.dataUrl.match(/^data:.*?;base64,(.*)$/);
      if (match) fs.writeFileSync(path.join(assetsDir, path.basename(asset.name)), Buffer.from(match[1], 'base64'));
    }
  }
  return { canceled: false, path: root };
});
function safeName(s) { return String(s).replace(/[^a-z0-9_-]/gi, '_').toLowerCase().slice(0, 48) || 'minha_nui'; }
