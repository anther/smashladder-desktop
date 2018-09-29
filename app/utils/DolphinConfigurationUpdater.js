/* eslint-disable prefer-destructuring */
import path from 'path';
import fs from 'fs';
import ini from 'ini';
import _ from 'lodash';
import Files from './Files';

export default class DolphinConfigurationUpdater {
	constructor(buildPath){
		if(!buildPath)
		{
			throw new Error('Invalid Dolphin Path');
		}
		this.buildPath = buildPath;
		this.iniLocationToUse = null;
		this.loadedConfigurationPath = null;
	}

	getDolphinIniLocation(){
		if(this.iniLocationToUse)
		{
			return this.iniLocationToUse;
		}
		let configLocation = [];
		try
		{
			configLocation = Files.findInDirectory(
				path.dirname(this.buildPath),
				'Dolphin.ini'
			);
		} catch(error)
		{
			throw error;
		}
		if(configLocation.length > 1)
		{
			throw new Error(
				`Found more than one Dolphin.ini ${configLocation.join(' ')}`
			);
		}
		if(configLocation.length === 0)
		{
			throw new Error('Could not find a Dolphin.ini to update');
		}
		this.iniLocationToUse = configLocation[0];
		return this.iniLocationToUse;
	}

	loadAConfiguration(filePath){
		this.loadedConfigurationPath = filePath;
		return ini.parse(fs.readFileSync(filePath, 'utf-8'));
	}

	loadMainSettingsConfiguration(){
		this.loadedConfigurationPath = this.getDolphinIniLocation();
		return ini.parse(fs.readFileSync(this.loadedConfigurationPath, 'utf-8'));
	}

	saveConfiguration(config){
		return this.saveFile(ini.stringify(config, { whitespace: true }));
	}

	saveFile(fileContents){
		return fs.writeFileSync(
			this.loadedConfigurationPath,
			fileContents
		);
	}

	static setSlippiToPlayback(configPath){
		const updater = new DolphinConfigurationUpdater(configPath);
		const config = updater.loadAConfiguration(configPath);
		if(config['Gecko_Enabled']['$Slippi Recording'])
		{
			delete config['Gecko_Enabled']['$Slippi Recording'];
			config['Gecko_Enabled']['$Slippi Playback'] = true;
			updater.saveGeckoCodeConfiguration(config);
		}
	}

	saveGeckoCodeConfiguration(config){
		let stringified = ini.stringify(config, { whitespace: true });
		stringified = DolphinConfigurationUpdater.eraseAll(stringified, ' = true');
		this.saveFile(stringified);
	}

	static setSlippiToRecord(configPath){
		const updater = new DolphinConfigurationUpdater(configPath);
		const config = updater.loadAConfiguration(configPath);
		if(config['Gecko_Enabled']['$Slippi Playback'])
		{
			delete config['Gecko_Enabled']['$Slippi Playback'];
			config['Gecko_Enabled']['$Slippi Recording'] = true;
			updater.saveGeckoCodeConfiguration(config);
		}
	}

	static eraseAll(string, search){
		return string.replace(new RegExp(search, 'g'), '');
	};



	static async copyInitialSettingsFromBuild(
		buildPath,
		addRomPath,
		updateAllowDolphinAnalytics,
		updateSearchRomSubdirectories
	){
		const updater = new DolphinConfigurationUpdater(buildPath);
		const config = updater.loadMainSettingsConfiguration();

		DolphinConfigurationUpdater.forEachIsoEntries(config, isoPath => {
			console.log('attempting to add', isoPath);
			addRomPath(isoPath);
		});
		if(config.General && config.General.RecursiveISOPaths === 'True')
		{
			// Only Update this if it's true, the default is typically false
			console.log('Search subdirectories was true');
			updateSearchRomSubdirectories(true);
		}
		if(config.Analytics && config.Analytics.Enabled === 'True')
		{
			console.log('Analytics was true');
			updateAllowDolphinAnalytics(config.Analytics.Enabled === 'True');
		}
		console.log('finished');
	}

	static async mergeSettingsIntoDolphinIni(buildPath, settings){
		const updater = new DolphinConfigurationUpdater(buildPath);
		const config = updater.loadMainSettingsConfiguration();
		_.merge(config, settings);
		return updater.saveConfiguration(config);
	}

	static forEachIsoEntries(config, callback){
		if(!config.General)
		{
			return;
		}
		let hasIsoEntry = false;
		let entryNumber = 0;
		do
		{
			const currentIsoPathName = `ISOPath${entryNumber}`;
			if(config.General[currentIsoPathName])
			{
				hasIsoEntry = true;
				callback(
					config.General[currentIsoPathName],
					currentIsoPathName,
					entryNumber
				);
			}
			else
			{
				hasIsoEntry = false;
			}
			entryNumber++;
		}while(hasIsoEntry);
	}

	static async updateInitialSettings(
		buildPath,
		{ romPaths, searchRomSubdirectories, allowDolphinAnalytics }
	){
		const updater = new DolphinConfigurationUpdater(buildPath);
		const config = updater.loadMainSettingsConfiguration();
		if(!config.General)
		{
			config.General = {};
		}
		console.log('the rom paths', romPaths);
		if(!_.isEmpty(romPaths))
		{
			DolphinConfigurationUpdater.forEachIsoEntries(
				config,
				(isoPath, currentIsoPathName) => {
					console.log(
						`removing ${currentIsoPathName} ${
							config.General[currentIsoPathName]
							}`
					);
					delete config.General[currentIsoPathName];
				}
			);

			let newEntries = 0;
			_.forEach(romPaths, romPath => {
				const currentIsoPathName = `ISOPath${newEntries}`;
				console.log(`adding ${currentIsoPathName} - ${romPath}`);
				config.General[currentIsoPathName] = romPath;
				newEntries++;
			});
			config.General.ISOPaths = newEntries;
		}

		// Set Analytics Settings
		if(!config.Analytics)
		{
			config.Analytics = {};
		}
		console.log('Updating analytics settings');
		config.Analytics.Enabled = allowDolphinAnalytics ? 'True' : 'False';
		config.Analytics.PermissionAsked = 'True';

		// Set Search Subdirectories Checkbox
		if(searchRomSubdirectories !== null)
		{
			console.log('Setting search recursively', searchRomSubdirectories);
			config.General.RecursiveISOPaths = searchRomSubdirectories
				? 'True'
				: 'False';
		}
		updater.saveConfiguration(config);
		return true;
	}
}
