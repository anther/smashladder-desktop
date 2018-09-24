
import watch from 'node-watch';
import SlippiGame from 'slp-parser-js';
import { SmashLadderAuthentication, SUBMIT_REPLAY_URL} from '../utils/SmashLadderAuthentication.js';

import fs from 'fs';
import multitry from '../utils/multitry'
import {endpoints} from "./SmashLadderAuthentication";
import {Files} from "./Files";

export default class ReplaySyncer {
	constructor(settings) {
		this.updateWatchSettings(settings);
		this.state = {
			lastGame: null,
			watching: null,
			sending: null,
		}
	}

	setAuthentication(authentication: ?SmashLadderAuthentication){
		this.authentication = authentication;
		return this;
	}

	setReplayPath(replayPath){
		this.replayPath = replayPath;
		return this;
	}

	getSyncStatusStatement(){
		if(this.slippiGame)
		{
			return 'Sending game result';
		}
		else
		{
			return 'Waiting';
		}
	}

	static retrieve(settings) : ReplaySyncer {
		if(ReplaySyncer.instance)
		{
			console.log('retrieve');
			return ReplaySyncer.instance.updateWatchSettings(settings);
		}
		else
		{
			ReplaySyncer.instance = new ReplaySyncer(settings);
			return ReplaySyncer.instance;
		}
	}

	setState(stateUpdate){
		Object.assign(stateUpdate, this.state);
	}

	updateWatchSettings(settings) {
		console.log('updating watch settings to ', settings);
		this.settings = settings;
		this.startWatchingIfSettingsAreGood();
		return this;
	}

	_getRootPath() {
		return this.replayPath;
	}

	startWatchingIfSettingsAreGood() {
		if(this.watcher)
		{
			this.watcher.close();
		}
		if(!this._getRootPath())
		{
			console.log('can not start watching since root path is not set');
			return;
		}
		this.watcher = watch(this._getRootPath(), {recursive: false}, (event, filePath) => {
			if (event == 'remove') {
				return;
			}
			fs.lstat(filePath, (err, stats) => {
				if (err) {
					return console.log(err); //Handle error
				}
				else {
					if (stats.isFile()) {
						this.slippiGame = null;
						this.updateLastGame(filePath);
					}
				}
			});
		});
	}

	updateLastGame(file) {
		if (file && !this.slippiGame) {
			this.setState({watching: file});
			this.loadGame(file).then(gameData => {
				this.setState({
					lastGame: gameData,
					watching: null,
					sending: true
				});

				const game = {
					metadata: gameData.metadata,
					stats: gameData.stats,
					settings: gameData.settings,
				};
				const sendData = {
					game: JSON.stringify(game),
					source: 'slippiLauncher',
				};

				this.authentication.apiPost(endpoints.SUBMIT_REPLAY_RESULT, sendData)
					.then((response) => {
					console.log('response', response);
					this.setState({sent: true})
					if (response.other_players) {
						this.createBetterFileName(file, {
							others: response.other_players,
						})
					}
					else {
					}
				}).catch((response) => {
					console.log('response failed', response);
					this.setState({sending: false});
				})
			}).catch(error => {
			})

		}

	}

	createBetterFileName(originalFile, {others = []}) {
		const date = new Date();
		const folder = `${this._getRootPath()}/${date.getFullYear()}-${forceTwoDigits(date.getMonth())}-${forceTwoDigits(date.getDate())}`;
		const hour = forceTwoDigits(date.getHours());
		let usernameList = '';
		if (others.length) {
			usernameList = others.map((other) => other.username.replace(/[^a-z0-9]/gi, '_')).join('-');
			usernameList = `_with-${usernameList}`;
		}
		else {
			usernameList = '';
		}
		const fileName = `${hour}${forceTwoDigits(date.getMinutes())}${usernameList}.slp`;
		const newName = `${folder}/${fileName}`;

		Files.ensureDirectoryExists(folder, 0o755, (error) => {
			if (!error) {
				fs.rename(originalFile, newName, (error) => {
					if (error) {
						throw error;
					}
				});
			}
		})
	}

	loadGame(file) {
		return multitry(500, 5, () => {
			const data = {};
			data.game = new SlippiGame(file);
			data.settings = data.game.getSettings();
			data.metadata = data.game.getMetadata();
			data.stats = data.game.getStats();
			if (!data.settings || data.settings.stageId === 0) {
				throw new Error('Invalid data');
			}
			return data;
		});
	}
}
ReplaySyncer.instance = null;