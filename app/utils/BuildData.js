import path from 'path';
import _ from 'lodash';
import CacheableDataObject from './CacheableDataObject';
import Files from './Files';
import DolphinConfigurationUpdater from './DolphinConfigurationUpdater';

export default class Build extends CacheableDataObject {
	static getSlippiBuilds(builds) {
		let foundBuilds = new Set();
		_.each(builds, (build) => {
			if (build.getSlippiPath()) {
				foundBuilds.add(build);
			}
		});
		foundBuilds = Array.from(foundBuilds);
		return foundBuilds;
	}

	beforeConstruct() {
		this.games = [];
		this.pathError = false;
	}

	addLadder(ladder) {
		this.games.push(ladder);
	}

	getPossibleGames() {
		return this.games;
	}

	getPrimaryGame() {
		if (!this.games.length) {
			return null;
		}
		return this.games[0];
	}

	executablePath() {
		return this.path;
	}

	executableDirectory() {
		return this.path ? path.resolve(path.dirname(this.path)) : null;
	}

	addLaunch() {
		if (this.launches === undefined) {
			this.launches = 0;
		}
		this.launches++;
	}

	addGameLaunch() {
		if (this.gameLaunches === undefined) {
			this.gameLaunches = 0;
		}
		this.gameLaunches++;
	}

	getSlippiPath(forceRecheck = false) {
		if (!this.path) {
			return null;
		}
		if (this._slippiPath !== undefined && !forceRecheck) {
			return this._slippiPath;
		}
		const expectedSlippiPath = path.join(this.executableDirectory(), 'Slippi');
		try {
			if (DolphinConfigurationUpdater.hasSlippiConfiguration(this.getMeleeSettingsIniLocation())) {
				Files.ensureDirectoryExistsSync(expectedSlippiPath);
				return (this._slippiPath = expectedSlippiPath);
			}
		} catch (error) {
			console.error(error);
			return null;
		}
		return (this._slippiPath = null);
	}

	getMeleeCodeIniLocation() {
		const iniSettingsLocation = Files.findInDirectory(this.executableDirectory(), 'GALE01r2.ini');
		console.log('code Ini Location', iniSettingsLocation);
		if (!iniSettingsLocation.length) {
			return null;
		}
		return iniSettingsLocation[0];
	}

	getMeleeSettingsIniLocation() {
		const iniSettingsLocation = Files.findInDirectory(this.executableDirectory(), 'GALE01.ini');
		console.log('settings locatin', iniSettingsLocation);
		if (!iniSettingsLocation.length) {
			return null;
		}
		return iniSettingsLocation[0];
	}

	_retrieveSlippiSetup() {
		if(!this.getSlippiPath()){
			return {};
		}
		const settings = this.getMeleeSettingsIniLocation();
		const codeIniLocation = this.getMeleeCodeIniLocation();
		if (!settings || !codeIniLocation) {
			return {};
		}
		return { settings, codeIniLocation };
	}

	setSlippiToPlayback() {
		const { settings, codeIniLocation } = this._retrieveSlippiSetup();
		if(!settings){
			return false;
		}
		DolphinConfigurationUpdater.setSlippiToPlayback(settings, codeIniLocation);
		return true;
	}

	setSlippiToRecord() {
		const { settings, codeIniLocation } = this._retrieveSlippiSetup();
		if(!settings){
			return false;
		}
		DolphinConfigurationUpdater.setSlippiToRecord(settings, codeIniLocation);
		return true;
	}

	hasDownload() {
		const acceptableExtensions = { '.zip': 1 };
		if (!this.download_file) {
			return false;
		}
		const extension = path.extname(this.download_file).toLowerCase();
		return !!acceptableExtensions[extension];
	}
}
Build.prototype.serializeFields = [
	'active',
	'default',
	'description',
	'detail_url',
	'dolphin_build_id',
	'download_file',
	'icon_directory',
	'is_currently_used',
	'ladder_id',
	'name',
	'order',
	'path',
	'manuallyUnsetBuildPath',
];
