import _ from 'lodash';
import io from 'socket.io-client';
import { LinearBackoff } from 'simple-backoff';
import { ipcRenderer } from 'electron';
import { endpoints } from './SmashLadderAuthentication';

export default class LadderWebsocket {
	constructor() {
		this.websocket = null;
		this.potentialFailure = null;

		this.onControlMessage = this.onControlMessage.bind(this);

		this.connectionBackoff = new LinearBackoff({
			min: 0,
			step: 5000,
			max: 600000 // 60000 = Ten Minutes
		});
		this.reconnectTimeout = null;
		this.retryingCounter = null;
		this.connectedForABitTimeout = null;
	}

	setup(authentication, dispatch, getState, actions) {
		this.authentication = authentication;
		this.getState = getState;
		this.dispatch = dispatch;
		_.each(actions, (action, key) => {
			actions[key] = (...theArgs) => {
				this.dispatch(action(...theArgs));
			};
		});
		this.actions = actions;
		this.updateWebsocketCommands();
	}

	updateWebsocketCommands() {
		const { startGame, hostBuild, joinBuild, closeDolphin, disableConnection } = this.actions;
		this.websocketCommands = {
			selectVersion: () => {
				console.info('select version trigger');
			},

			startedMatch: () => {
				console.info('started match trigger');
			},

			hostNetplay: message => {
				hostBuild(message.dolphin_version, message.game_launch_name);
			},

			sendChatMessage: message => {
				if (
					!message.data ||
					!message.data.dolphin_version ||
					!message.data.dolphin_version.id
				) {
					throw new Error('Dolphin Data not included');
				}
			},

			startNetplay: message => {
				if (!message.force_close) {
					console.log('the message', message);
					return;
				}
				joinBuild(message.dolphin_version, message.parameters && message.parameters.host_code);
			},

			quitDolphin: () => {
				closeDolphin();
			},

			startGame: () => {
				startGame();
			},

			disableConnection: message => {
				console.log('the authentication (Make sure it has .sessionId), then remove this comment', this.authentication);
				if (String(this.authentication.sessionId) === String(message.session_id)) {
					console.log('[I GET TO LIVE]');
				} else {
					disableConnection();
				}
			}
		};
	}

	connect() {
		this.updateWebsocketIfNecessary();
		ipcRenderer.removeAllListeners('websocket-message');
		ipcRenderer.send('websocket-host');
		ipcRenderer.on('websocket-message', (event, message) => {
			const parsed = JSON.parse(message);
			console.log('got websocket message', event, parsed);
			this.processMessage(parsed);
		});
	}

	disconnect() {
		this.clearTimers();
		if (this.websocket) {
			this.websocket.disconnect();
		}
	}

	fetchBuildFromDolphinVersion(dolphinVersion) {
		return this.getState().builds.builds[dolphinVersion.id];
	}

	clearTimers() {
		clearTimeout(this.reconnectTimeout);
		clearTimeout(this.potentialFailure);
		clearInterval(this.retryingCounter);

		this.reconnectTimeout = null;
	}

	updateWebsocketIfNecessary() {
		const { ladderWebsocketConnectionEnabled } = this.getState().ladderWebsocket;
		if (this.websocket) {
			if (!ladderWebsocketConnectionEnabled) {
				console.log('close!');
				this.clearTimers();
				this.websocket.disconnect();
				return;
			}
			if (this.websocket.connected) {
				console.log('connected so it is whateva');
				return;
			}
		}

		if (!ladderWebsocketConnectionEnabled) {
			return;
		}

		if (!this.reconnectTimeout) {
			console.log('reinitializing reconnection');
			const nextRetry = this.connectionBackoff.next();
			const estimatedWhen = new Date(Date.now() + nextRetry);
			this.retryingCounter = setInterval(() => {
				const time = Math.floor((estimatedWhen.getTime() - Date.now()) / 1000);
				this.actions.updateSecondsUntilRetry(time > 0 ? time : 0);
			}, 1000);

			// This gets cleared as soon as the timeout runs
			this.reconnectTimeout = setTimeout(() => {
				const { authentication } = this;
				console.log('attempting reconnection??');
				if (this.websocket && this.websocket.connected) {
					console.log('somehow we are already connected!');
				}
				if (this.websocket) {
					this.websocket.disconnect();
				}

				this.clearTimers();
				console.log('creating a new websocket connection now');
				this.websocket = io(authentication.fullEndpointUrl(endpoints.WEBSOCKET_URL), {
					query: {
						access_token: authentication.getAccessCode(),
						version: '1.0.0',
						type: 5, // 5 = Dolphin Launcher
						launcher_version: '2.0.0'
					},
					forceNew: true,
					transports: ['websocket']
				});
				this.websocket.on('connect', () => {
					this.actions.ladderWebsocketConnectionInitialOpen();
					this.connectedForABitTimeout = setTimeout(() => {
						this.actions.ladderWebsocketConnectionStabilized();
						this.connectionBackoff.reset();
					}, 2000);
				});
				this.websocket.on('authenticated', () => {
					console.log('Authenticated!!');
				});

				this.websocket.on('message', this.onControlMessage);

				this.websocket.on('error', (evt) => {
					console.error(evt);
				});

				this.websocket.on('disconnect', () => {
					this.actions.ladderWebsocketConnectionClosed();
					clearTimeout(this.connectedForABitTimeout);
					clearTimeout(this.potentialFailure);
				});

				this.actions.ladderWebsocketBeginningConnection();
			}, nextRetry);
		}
	}

	onControlMessage(message) {
		// This used to be a little bit more complicated before socket.io >.>
		this.processMessage(message);
	}

	processMessage(message) {
		if (!message.functionCall) {
			return;
		}
		console.log('received message', message);
		if (!this.websocketCommands[message.functionCall]) {
			console.error(`[ACTION NOT FOUND] ${message.functionCall}`);
		}

		try {
			if (message.data) {
				if (message.data.dolphin_version) {
					message.data.dolphin_version = this.fetchBuildFromDolphinVersion(message.data.dolphin_version);
				}
				if (message.data.game_launch_name) {
					const gameInfo = message.data.game_launch_name;

					gameInfo.dolphin_game_id_hint = gameInfo.launch;
					gameInfo.name = gameInfo.game;
				}
				if (message.parameters) {
					message.data.parameters = message.parameters;
				}
			}
			console.log('message ends up being', message);
			this.websocketCommands[message.functionCall](message.data);
		} catch (error) {
			console.error('websocket message error');
			console.error(error);
		}
	}

}