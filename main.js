/**
 * main.js
 * Electron main process script defining the standalone desktop window lifecycle.
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 600,
        backgroundColor: '#090d16', // Slate dark theme color
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        title: "LCD1 Reducer — Desktop Offline App"
    });

    // Remove top menu bar for a sleek native desktop app layout
    mainWindow.removeMenu();

    // Load local bundled index.html
    mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
