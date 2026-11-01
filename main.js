const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

const TRUSTED_EXTERNAL_PREFIXES = ['https://t.me/'];

const isTrustedExternal = (url) =>
  TRUSTED_EXTERNAL_PREFIXES.some((prefix) => url.startsWith(prefix));

function createWindow() {
  const win = new BrowserWindow({
    width: 760,
    height: 620,
    resizable: false,
    frame: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'icons', 'wallet.ico'),
    // The page needs no Node.js access: keep it fully isolated.
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  });

  // Open trusted links (developer contact) in the system browser; block all other popups.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isTrustedExternal(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Never let the app window navigate away from the local page.
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) {
      event.preventDefault();
      if (isTrustedExternal(url)) {
        shell.openExternal(url);
      }
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
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
