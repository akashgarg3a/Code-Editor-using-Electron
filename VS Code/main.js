const { app, BrowserWindow } = require('electron');
const path = require('path');
const reload = require('electron-reload')
reload(__dirname, { 
        electron: path.join(__dirname, 'node_modules/.bin/electron.cmd') 
    }); 
   

function createWindow() {
    let win = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        webPreferences: {
            nodeIntegration: true
        }
    });
    win.loadFile('index.html').then(function() {
        win.maximize();
        win.show();
        win.removeMenu();
        win.webContents.openDevTools();
    });
    
}
app.allowRendererProcessReuse = false;

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})