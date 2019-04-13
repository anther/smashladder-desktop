import { ipcMain } from 'electron';
import WebSocket from 'ws';

export default class WebsocketServer {
	constructor() {
		this.server = null;
	}

	host(sender) {
		if (this.server) {
			return this.server;
		}
		this.server = new WebSocket.Server({ port: 8081 });

		this.server.on('connection', (websocket) => {
			websocket.on('message', (message) => {
				sender.send('websocket-message', message);
			});
			websocket.on('error', (message) => {
				sender.send('websocket-error', message);
			});
		});
		return this.server;
	}
}

ipcMain.on('websocket-host', (event) => {
	server.host(event.sender);
});

const server = new WebsocketServer();