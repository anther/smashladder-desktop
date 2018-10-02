/* eslint global-require: 0, flowtype-errors/show-errors: 0 */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 *
 * @flow
 */
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import _ from 'lodash';
import AutoLaunch from 'auto-launch';
import MenuBuilder from './menu';

let mainWindow = null;

autoUpdater.autoDownload = false;
ipcMain.on('autoUpdate-start', () => {
  autoUpdater.downloadUpdate();
});
ipcMain.on('autoUpdate-initialize', event => {
  const listeners = {
    error: error => {
      event.sender.send('autoUpdate-error', error);
    },
    'update-available': () => {
      event.sender.send('autoUpdate-update-available');
    },
    'update-not-available': () => {
      event.sender.send('autoUpdate-update-not-available');
    },
    'update-downloaded': () => {
      event.sender.send('autoUpdate-update-downloaded');
      setImmediate(() => autoUpdater.quitAndInstall());
    }
  };
  _.forEach(listeners, (listenerFunction, listenerName) => {
    autoUpdater.removeAllListeners(listenerName);
    autoUpdater.on(listenerName, listenerFunction);
  });
  event.sender.send('autoUpdate-initialized');
  autoUpdater.checkForUpdates();
});

const autoLaunch = new AutoLaunch({
  name: 'SmashLadder Dolphin Launcher',
  path: app.getPath('exe'),
  isHidden: true
});
autoLaunch
  .isEnabled()
  .then(isEnabled => {
    if (!isEnabled) autoLaunch.enable();
  })
  .catch(error => {
    console.error(error);
  });

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
  const path = require('path');
  const p = path.join(__dirname, '..', 'app', 'node_modules');
  require('module').globalPaths.push(p);
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(
    extensions.map(name => installer.default(installer[name], forceDownload))
  ).catch(console.log);
};

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// to make singleton instance
const isSecondInstance = app.makeSingleInstance(() => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

if (isSecondInstance) {
  app.quit();
}

app.on('ready', async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 992,
    height: 728
  });

  mainWindow.loadURL(`file://${__dirname}/app.html`);

  mainWindow.webContents.on('new-window', (event, url) => {
    console.log('new window function');
    event.preventDefault();
    shell.openExternal(url);
  });

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();
});
