import SlippiGame from 'slp-parser-js';
import _ from 'lodash';
import path from 'path';
import moment from 'moment';
import md5File from 'md5-file/promise';
import fs from 'fs';
import CacheableDataObject from './CacheableDataObject';
import MeleeStage from './replay/MeleeStage';
import SlippiFrame from './replay/SlippiFrame';
import Numbers from './Numbers';
import SlippiStock from './replay/SlippiStock';
import SlippiPlayer from './replay/SlippiPlayer';

export default class Replay extends CacheableDataObject {

	beforeConstruct() {
		this.ignoreNewnessRestriction = false;
		this._fileDate = null;
		this.resetData();
	}

	resetData() {
		this.hasSavedCachedSettings = false;
		this.stats = null;
		this.settings = {};
		this.metadata = {};
		this.game = null;
		this.hasErrors = null;
		this._md5 = null;
		this._parsedMetaData = false;
		this.rawData = {
			settings: {},
			metadata: {},
			stats: {}
		};
		this.build = null;
		this.possibleErrors = {
			noSettings: false,
			noMetadata: false,
			noStats: false
		};
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
		if (this.isReadable()) {
			const stats = this.getStats();
			if (stats && stats.startAt) {
				return this._fileDate = this.stats.startAt;
			}
		}
		const fileStats = fs.lstatSync(this.filePath);
		const theMoment = moment(fileStats.birthtime);
		return this._fileDate = theMoment;
	}

	getName() {
		this.parseMetadata();
		if (!this.isReadable()) {
			return this.getFileName();
		}
		if (this.hasDefaultFileName()) {
			const characters = this.getCharacters();
			const { stage } = this.settings;
			if (!stage) {
				console.log('no stage');
				return this.getFileName();
			}

			return `${characters.map(character => character.name).join(` vs `)} on ${stage.name}`;
		}
	}

	isALittleGlitchy() {
		const isGlitchy = this.possibleErrors.noMetadata && !this.possibleErrors.noSettings;
		return isGlitchy;
	}

	getMatchTime() {
		this.parseMetadata();
		if (this.isReadable()) {
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

	hasStatsLoaded() {
		return !this.isReadable() || this.stats !== null;
	}

	getStats() {
		if (!this.isReadable()) {
			return null;
		}
		if (this.stats === null) {
			const game = this.retrieveSlippiGame();
			try {
				this.stats = game.getStats();
			}
			catch (error) {

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

	updateStats() {
		const stockData = this.stats.stocks;
		this.stats.stocks = [];
		for (let stock of stockData) {
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
	}

	getSettings() {
		this.parseMetadata();
		return this.settings;
	}

	getMetadata() {
		this.parseMetadata();
		return this.metadata;
	}

	getMd5() {
		if (this._md5 !== null) {
			return this._md5;
		}
		// Prepend an M so that the key always starts with a letter
		return this._md5 = `m${md5File.sync(this.id)}`;
	}

	loadCachedSettings() {
		// const settings =  electronSettings.get(`replayCache.settings.${this.getMd5()}`);
		const settings = null;
		if (settings) {
			this.hasSavedCachedSettings = true;
		}
		return settings;
	}

	saveCache() {
		if (this.hasSavedCachedSettings) {
			return;
		}
		const settings = {
			settings: this.rawData.settings,
			metadata: this.rawData.metadata
		};
		if (settings) {
			// this.hasSavedCachedSettings = true;
		}
		// electronSettings.set(`replayCache.settings.${this.getMd5()}`, settings);
	}

	retrieveSlippiGame() {
		return new SlippiGame(this.id);
	}

	parseMetadata() {
		if (!_.isEmpty(this.settings)) {
			this.hasErrors = false;
			return true;
		}
		try {
			const cachedSettings = this.loadCachedSettings();
			if (cachedSettings) {
				this.settings = cachedSettings.settings;
				this.metadata = cachedSettings.metadata;
				this.stats = _.isEmpty(cachedSettings.stats) ? null : cachedSettings.stats;
			}
			else if (fs.existsSync(this.filePath)) {
				const game = this.retrieveSlippiGame();
				this.settings = game.getSettings();
				this.metadata = game.getMetadata();
			}
			else {
				console.error('something went extra wrong!');
			}


			this.rawData.settings = _.cloneDeep(this.settings);
			this.rawData.metadata = _.cloneDeep(this.metadata);
			if (!cachedSettings) {
				this.saveCache();
			}

			if (_.isEmpty(this.metadata)) {
				this.possibleErrors.noMetadata = true;
			}

			if (_.isEmpty(this.settings) || this.settings.stageId === 0) {
				this.possibleErrors.noSettings = true;
				console.log('had invalid settings');
				this.hasErrors = true;
				return;
			}
		}
		catch (error) {
			console.log('fundamental parse error');
			console.error(error);
			this.hasErrors = true;
			return;
		}

		if (this._parsedMetaData) {
			console.log('parse skipped');
			return;
		}
		this._parsedMetaData = true;

		this.settings.players = this.settings.players.map((player) => {
			return SlippiPlayer.create(player);
		});
		this.settings.stage = MeleeStage.retrieve(this.settings.stageId);
		if (!_.isEmpty(this.metadata)) {
			this.metadata.startAt = moment(this.metadata.startAt, 'YYYY-MM-DDTHH:mm:ssZ', true);

			this.metadata.lastFrame = SlippiFrame.createFromFameNumber(this.metadata.lastFrame);
			this.metadata.endAt = this.metadata.startAt.clone().add(this.metadata.lastFrame.seconds(), 'seconds');
		}
	}

	getFileName() {
		return path.basename(this.id);
	}

	get filePath() {
		return this.id;
	}

	getStage() {
		this.parseMetadata();
		if (this.settings && this.settings.stage) {
			return this.settings.stage;
		}
		return null;
	}

	getCharacters() {
		return this.getPlayers().map((player) => (
			player.character
		));
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