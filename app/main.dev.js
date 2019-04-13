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
import { app, BrowserWindow, shell, ipcMain, Menu, Tray } from 'electron';
import { autoUpdater } from 'electron-updater';
import _ from 'lodash';
import AutoLaunch from 'auto-launch';
import electronSettings from 'electron-settings';
import path from 'path';
import Files from './utils/Files';
import './utils/WebsocketServer';

let mainWindow = null;

const LAUNCH_AT_STARTUP_KEY = 'launchAtStartup';
const ALWAYS_MINIMIZE_TO_TRAY_KEY = 'alwaysMinimizeToTray';
const AUTO_LAUNCH_MINIMIZED_KEY = 'autoLaunchMinimized';

autoUpdater.autoDownload = false;
ipcMain.on('autoUpdate-start', () => {
	autoUpdater.downloadUpdate();
});
ipcMain.on('autoUpdate-initialize', (event) => {
	const listeners = {
		error: (error) => {
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

if (process.env.NODE_ENV === 'production') {
	const sourceMapSupport = require('source-map-support');
	sourceMapSupport.install();
}

if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
	require('electron-debug')();
	const p = path.join(__dirname, '..', 'app', 'node_modules');
	require('module').globalPaths.push(p);
}

const installExtensions = async () => {
	const installer = require('electron-devtools-installer');
	const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
	const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

	return Promise.all(extensions.map((name) => installer.default(installer[name], forceDownload))).catch(
		console.log
	);
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
		mainWindow.show();
		mainWindow.restore();
		mainWindow.focus();
	}
});

if (isSecondInstance) {
	app.quit();
}
else {
	let tray = null;
	let debugTray = {
		send: () => {
		}
	};
	app.on('ready', () => {
		const imagePath = Files.createApplicationPath('./external/android-icon-36x36.png');
		// const trayImage = nativeImage.createFromPath(imagePath);

		ipcMain.on('debugTray', (event) => {
			debugTray = event.sender;
			event.sender.send('debugTray', imagePath);
		});

		tray = new Tray(imagePath);
		updateTray().catch((error) => {
			console.log('tray error');
			console.error(error);
		});

		tray.on('click', () => {
			mainWindow.show();
			mainWindow.restore();
			mainWindow.focus();
		});
		tray.on('double-click', () => {
			mainWindow.show();
		});
		tray.setToolTip('SmashLadder Dolphin Launcher');
	});
	const configurationSettings = {};
	app.on('ready', async () => {
		if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
			await installExtensions();
		}

		configurationSettings.alwaysMinimizeToTray = electronSettings.get(ALWAYS_MINIMIZE_TO_TRAY_KEY, false);
		configurationSettings.autolaunchMinimized = electronSettings.get(AUTO_LAUNCH_MINIMIZED_KEY, true);

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

		mainWindow.on('minimize', (event) => {
			event.preventDefault();
			if (configurationSettings.alwaysMinimizeToTray) {
				mainWindow.hide();
			} else {
				mainWindow.minimize();
			}
		});

		mainWindow.webContents.on('did-finish-load', () => {
			if (!mainWindow) {
				throw new Error('"mainWindow" is not defined');
			}
			const autoLaunched = (process.argv || []).indexOf('--hidden') !== -1 || process.env.AUTOLAUNCH_TEST;
			if (autoLaunched && configurationSettings.autolaunchMinimized) {
				mainWindow.hide();
			} else {
				mainWindow.show();
				mainWindow.focus();
			}
		});

		mainWindow.on('closed', () => {
			mainWindow = null;
		});
	});

	const setupAutoLaunch = async () => {
		const autoLaunch = new AutoLaunch({
			name: 'SmashLadder Dolphin Launcher',
			path: app.getPath('exe'),
			isHidden: true
		});
		let launchAtStartup = await electronSettings.get(LAUNCH_AT_STARTUP_KEY);
		if (launchAtStartup === undefined) {
			try {
				const isEnabled = await autoLaunch.isEnabled();
				if (!isEnabled) {
					autoLaunch.enable();
					launchAtStartup = true;
					electronSettings.set(LAUNCH_AT_STARTUP_KEY, launchAtStartup);
				}
			} catch (error) {
				console.error(error);
			}
		}
		return {
			autoLaunch,
			launchAtStartup
		};
	};

	const updateTray = async () => {
		const { autoLaunch, launchAtStartup } = await setupAutoLaunch();
		const contextMenu = Menu.buildFromTemplate([
			{
				label: app.getVersion(),
				enabled: false
			},
			{
				type: 'separator'
			},
			{
				label: 'Always Minimize to Tray',
				checked: !!configurationSettings.alwaysMinimizeToTray,
				type: 'checkbox',
				click: () => {
					configurationSettings.alwaysMinimizeToTray = !configurationSettings.alwaysMinimizeToTray;
					electronSettings.set(ALWAYS_MINIMIZE_TO_TRAY_KEY, configurationSettings.alwaysMinimizeToTray);
				}
			},
			{
				label: 'Launch At Startup',
				checked: !!launchAtStartup,
				type: 'checkbox',
				click: () => {
					debugTray.send('debugTray', `launch at startup ${launchAtStartup}`);
					if (launchAtStartup) {
						autoLaunch
							.disable()
							.then(() => {
								electronSettings.set(LAUNCH_AT_STARTUP_KEY, false);
								updateTray();
							})
							.catch((error) => {
								if (debugTray) {
									debugTray.send('debugTray', error);
								}
							});
					} else {
						autoLaunch
							.enable()
							.then(() => {
								electronSettings.set(LAUNCH_AT_STARTUP_KEY, true);
								updateTray();
							})
							.catch((error) => {
								if (debugTray) {
									debugTray.send('debugTray', error);
								}
							});
					}
				}
			},
			{
				label: 'Launch Hidden at Startup',
				checked: !!configurationSettings.autolaunchMinimized,
				type: 'checkbox',
				click: () => {
					configurationSettings.autolaunchMinimized = !configurationSettings.autolaunchMinimized;
					electronSettings.set(AUTO_LAUNCH_MINIMIZED_KEY, configurationSettings.autolaunchMinimized);
				}
			},
			{
				label: 'Quit',
				click: () => {
					app.quit();
				}
			}
		]);
		tray.setContextMenu(contextMenu);
	};
}


