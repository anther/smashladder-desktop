import { ipcRenderer } from 'electron';



export const debugTray = () => {
	ipcRenderer.send('debugTray');

	ipcRenderer.on('debugTray', (event, message)=>{
		console.log('debugTray', message);
	});
};

debugTray();