import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import store from './backend/store.js';
import  request  from './backend/request.js';
import  {errorLog, infoLog}  from './backend/log.js';
import {onData} from './backend/quotes.js'
import {version} from '@utils/utils.js'
import {send} from './backend/quotbrowser.js'

// 获取 __filename 和 __dirname 的 ESM 等价实现

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const useData = {}
const priceData = {};
const orderData = [];
const tradeData = [];
const historyData = {};
const positionData =[];

onData(function(quotData){
  if(!historyData[InstrumentID]){
    historyData[InstrumentID] = [quotData]
  }else{
    historyData[InstrumentID].push(quotData)
    if(historyData[InstrumentID].length > 20){
      historyData[InstrumentID].shift()
    }
  }
  priceData[InstrumentID] = quotData

})
function initMain(){
  
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    
     height: 375,
   
    width: 500,
    title: `Vtp  ${version}`,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
     
     
    },
  });
  mainWindow.setTitle(`Vtp  ${version}`);
  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.

  mainWindow.removeMenu()
  if(process.env.NODE_ENV === 'development'){
     mainWindow.webContents.openDevTools();
  }
 
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();
   ipcMain.handle('store:get', (_event, key) => {
    return store.get(key);
  });

  ipcMain.handle('store:set', (_event, key, value) => {
    store.set(key, value);
    return true;
  });
  ipcMain.handle('request', async (_event, config) =>{
    const result = await request(config).then(res => res.data);
    return result
  })
  ipcMain.on("login", (_even, data) => {
    useData = data;
    mainWindow.setSize(520, 400)
    mainWindow.setMenu(meun());
  })

  ipcMain.on('register-event', (_even, id)=> {
    
  })
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
