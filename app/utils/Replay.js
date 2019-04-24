import SlippiGame from 'slp-parser-js';
import _ from 'lodash';
import path from 'path';
import moment from 'moment';
import fs from 'fs';
import CacheableDataObject from './CacheableDataObject';
import MeleeStage from './replay/MeleeStage';
import SlippiFrame from './replay/SlippiFrame';
import Numbers from './Numbers';
import SlippiStock from './replay/SlippiStock';
import SlippiPlayer from './replay/SlippiPlayer';

export default class Replay extends CacheableDataObject {
	static REPLAY_END_LRA_START = 7;

	beforeConstruct() {
		this.ignoreNewnessRestriction = false;
		this._fileDate = null;
		this.slippiGame = null;
		this.resetData();
	}

	resetData() {
		// COMPLETE SETTINGS DO NOT CHANGE, COMPLETE METADATA DOES NOT CHANGE
		// ONLY STATS CHANGE AS TIME GOES ON.
		this.stats = null;
		this.rawData = {
			stats: {},
			metadata: this.rawData ? this.rawData.metadata : {},
			settings: this.rawData ? this.rawData.settings : {}
		};
		if (!this.settingsAreComplete()) {
			// Do not reset settings since they stay the same
			this.slippiGame = null;
			this.settings = {};
			this.rawData.settings = {};
		}
		if (!this.metadataIsComplete()) {
			this.slippiGame = null;
			this.metadata = {};
			this.rawData.metadata = {};
		}
		this.game = null;
		if (this.gameEnd === null) {
			this.gameEnd = undefined;
		}
		this.hasErrors = null;
		this._parsedMetaData = false;

		this.build = null;
		this.possibleErrors = {
			noSettings: false,
			noMetadata: false,
			noStats: false
		};
		return this;
	}

	setBuild(build) {
		this.build = build;
	}

	getBuild() {
		return this.build;
	}

	getErrorReasons() {
		if (this.possibleErrors.noMetadata) {
			return 'No Metadata found';
		}
		return 'Something interesting went wrong';
	}

	isNewish() {
		if (this.ignoreNewnessRestriction) {
			return true;
		}
		const fileDate = this.getFileDate();
		if (!fileDate) {
			return false;
		}
		return fileDate.isAfter(moment().subtract(30, 'minutes'));
	}

	hasDefaultFileName() {
		return this.getFileName().startsWith('Game_');
	}

	hasDirectoriedFileName() {
		const fileName = this.getFileName();
		for (let i = 0; i < 5; i++) {
			if (!Numbers.stringIsNumeric(fileName[i])) {
				return false;
			}
		}
		if (fileName[6] === '_') {
			return true;
		}
		return false;
	}

	hasFileDate() {
		return this._fileDate !== null;
	}

	getFileDate() {
		if (this._fileDate !== null) {
			return this._fileDate;
		}
		const fileName = this.getFileName();
		if (this.hasDefaultFileName()) {

			const dateString = fileName.slice(5, fileName.length - 4);
			return this._fileDate = moment(dateString, 'YYYYMMDDTHHmmss', true);
		}
		if (this.hasDirectoriedFileName()) {
			const directory = path.basename(path.dirname(this.id));
			const dateString = fileName.slice(0, 6);
			return this._fileDate = moment(`${directory}${dateString}`, 'YYYY-MM-DDHHmmss', true);
		}
		// if (this.isReadable()) {
		// 	const stats = this.getStats();
		// 	if (stats && stats.startAt) {
		// 		return this._fileDate = this.stats.startAt;
		// 	}
		// }
		const fileStats = fs.lstatSync(this.filePath);
		const theMoment = moment(fileStats.birthtime);
		return this._fileDate = theMoment;
	}

	isALittleGlitchy() {
		const isGlitchy = this.gameEnd && this.possibleErrors.noMetadata && !this.possibleErrors.noSettings;

		if (this.gameEnd && isGlitchy) {
			console.log('is glitchy', this.id, isGlitchy);
		}

		return isGlitchy;
	}

	getMatchTime() {
		if (this.isEnded()) {
			if (this.metadata.lastFrame) {
				return this.metadata.lastFrame.asTime();
			}
			return null;
		}
		return null;
	}

	isReadable() {
		this.parseMetadata();
		return !this.hasErrors;
	}

	getSerializableData() {
		this.getMetadata();
		this.getStats();
		return {
			metadata: this.rawData.metadata,
			stats: this.rawData.stats,
			settings: this.rawData.settings
		};
	}

	getStats() {
		if (!this.isReadable()) {
			return null;
		}

		if (this.stats === null) {
			const game = this.retrieveSlippiGame();
			try {
				this.stats = game.getStats();
			} catch (error) {
				console.log(`Slippi stats retrieval error ${this.filePath}`);
				console.error(error);
			}
			if (!this.stats) {
				console.log('stats failed after load?!');
				return null;
			}

			this.rawData.stats = _.cloneDeep(this.stats);
			this.updateStats();
		}
		return this.stats;
	}

	settingsAreComplete() {
		return this.settings && this.settings.players && this.settings.players.length > 0;
	}

	metadataIsComplete() {
		return !_.isEmpty(this.metadata);
	}

	updateStats() {
		console.log('the repay', this);
		const stockData = this.stats.stocks;
		this.stats.stocks = [];
		for (const stock of stockData) {
			this.stats.stocks.push(SlippiStock.create(stock));
		}
		this.stats.stocks.sort((a, b) => {
			if (a.startFrame.frame === null) {
				return -1;
			}
			if (b.startFrame.frame === null) {
				return 1;
			}
			return a.startFrame.frame > b.startFrame.frame ? 1 : -1;
		});
		let deathIndex = 1;
		for (const stock of this.stats.stocks) {
			stock.deathIndex = deathIndex++;
		}
		this.getPlayers().forEach((player) => {
			player.addStocks(this.stats.stocks);

			player.addConversions(this.stats.conversions);
			player.addActions(this.stats.actionCounts);
			player.addOverall(this.stats.overall);
		});

		this.parseMetadata();
		this.startAt = this.metadata.startAt ? moment(this.metadata.startAt, 'YYYY-MM-DDTHH:mm:ssZ', true) : this.getFileDate().clone();
		if (this.metadata.startAt) {
			this.metadata.startAt = this.startAt;
		}

		this.stats.lastFrame = SlippiFrame.createFromFrameNumber(this.stats.lastFrame);
		this.stats.endAt = this.startAt.clone().add(this.stats.lastFrame.seconds(), 'seconds');
	}

	getMetadata() {
		this.parseMetadata();
		return this.metadata;
	}

	retrieveSlippiGame() {
		return this.slippiGame = this.slippiGame ? this.slippiGame : new SlippiGame(this.id);
	}

	getGameEnd(game) {
		if (this.gameEnd) {
			return this.gameEnd;
		}
		if (!game) {
			game = this.retrieveSlippiGame();
		}
		this.gameEnd = game.getGameEnd();
		return this.gameEnd;
	}

	getLraStartPlayerName() {
		const gameEnd = this.getGameEnd();
		if (gameEnd.lrasInitiatorIndex !== undefined) {
			const player = this.getPlayers()[gameEnd.lrasInitiatorIndex];
			if (player) {
				return player.getNameTag();
			}
		}
		return 'Unknown';
	}

	isEnded() {
		if (this.gameEnd === undefined) {
			this.getGameEnd();
		}
		return !!this.gameEnd;
	}

	parseMetadata() {
		if (this.metadataIsComplete()) {
			this.hasErrors = false;
			return true;
		}
		try {
			console.trace('parsing replay...');
			const game = this.retrieveSlippiGame();
			if (this.getGameEnd(game)) {
				this.metadata = game.getMetadata();
				this.rawData.metadata = _.cloneDeep(this.metadata);
			}
			this.getSettings();

		} catch (error) {
			console.log('fundamental parse error');
			console.error(error);
			this.hasErrors = true;
			return;
		}

		if (!this.metadataIsComplete() || moment.isMoment(this.metadata.startAt)) {
			return;
		}
		if (this.metadata.startAt) {
			this.metadata.startAt = moment(this.metadata.startAt, 'YYYY-MM-DDTHH:mm:ssZ', true);
			this.metadata.lastFrame = SlippiFrame.createFromFrameNumber(this.metadata.lastFrame);
			this.metadata.endAt = this.metadata.startAt.clone().add(this.metadata.lastFrame.seconds(), 'seconds');
		}
		this.updateSettings(); // We can update certain settings based on updated metadata
	}

	updateSettings() {
		this.settings.players = this.settings.players.map((player, index) => {
			const slippiPlayer = SlippiPlayer.create(player);
			if (this.metadata.players) {
				const metadataPlayer = this.metadata.players[index];
				if (metadataPlayer && metadataPlayer.names && metadataPlayer.names.netplay) {
					slippiPlayer.netplayName = metadataPlayer.names.netplay;
				}
			}
			return slippiPlayer;
		});
		this.settings.stage = MeleeStage.retrieve(this.settings.stageId);
	}

	getFileName() {
		return path.basename(this.id);
	}

	get filePath() {
		return this.id;
	}

	getSettings() {
		if (!this.settingsAreComplete()) {
			console.log('getting settings');
			const game = this.retrieveSlippiGame();
			this.settings = game.getSettings(); // Settings stay the same always
			this.rawData.settings = _.cloneDeep(this.settings);
			this.updateSettings();
		}
		return this.settings;
	}

	getStage() {
		this.getSettings();
		if (this.settings && this.settings.stage) {
			return this.settings.stage;
		}
		return null;
	}

	getCharacters() {
		return this.getPlayers().map((player) => (player.character));
	}

	getPlayers() {
		if (!this.settings || !this.settings.players) {
			console.error('has no players!');
			return [];
		}
		return this.settings.players;
	}

	getPlayerIndex(number) {
		const isFirstPlayer = number === 1;
		const gameSettings = _.get(this, ['settings']) || {};
		const players = gameSettings.players || [];
		const player = (isFirstPlayer ? _.first(players) : _.last(players)) || {};
		return player.playerIndex;
	}

	toString() {
		return this.id;
	}

}

class ReplayEnd extends CacheableDataObject {
	beforeCreate() {
		this.gameEndMethod = null;
		this.lrasInitiatorIndex = null;
	}

}