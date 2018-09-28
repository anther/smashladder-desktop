/* eslint-disable prefer-destructuring */
import path from 'path';
import fs from 'fs';
import ini from 'ini';
import _ from 'lodash';
import Files from './Files';

export default class DolphinConfigurationUpdater {
  constructor(buildPath) {
    if (!buildPath) {
      throw new Error('Invalid Dolphin Path');
    }
    this.buildPath = buildPath;
    this.iniLocationToUse = null;
  }

  getDolphinIniLocation() {
    if (this.iniLocationToUse) {
      return this.iniLocationToUse;
    }
    let configLocation = [];
    try {
      configLocation = Files.findInDirectory(
        path.dirname(this.buildPath),
        'Dolphin.ini'
      );
    } catch (error) {
      throw error;
    }
    if (configLocation.length > 1) {
      throw new Error(`Found more than one Dolphin.ini ${configLocation.join(' ')}`);
    }
    if (configLocation.length === 0) {
      throw new Error('Could not find a Dolphin.ini to update');
    }
    this.iniLocationToUse = configLocation[0];
    return this.iniLocationToUse;
  }

  loadConfiguration() {
    return ini.parse(fs.readFileSync(this.getDolphinIniLocation(), 'utf-8'));
  }

  saveConfiguration(config) {
    return fs.writeFileSync(
      this.getDolphinIniLocation(),
      ini.stringify(config, { whitespace: true })
    );
  }

  static async copyInitialSettingsFromBuild(buildPath, addRomPath, updateAllowDolphinAnalytics, updateSearchRomSubdirectories) {
	  const updater = new DolphinConfigurationUpdater(buildPath);
	  const config = updater.loadConfiguration();

	  DolphinConfigurationUpdater.forEachIsoEntries(config, (isoPath) => {
	    console.log('attempting to add', isoPath);
        addRomPath(isoPath);
	  });
	  if(config.General && config.General.RecursiveISOPaths === "True") // Only Update this if it's true, the default is typically false
      {
	    console.log('SEarch subdirectories was true');
        updateSearchRomSubdirectories(true);
      }
	  if(config.Analytics && config.Analytics.Enabled === "True")
      {
	    console.log('Analytics was true');
        updateAllowDolphinAnalytics(config.Analytics.Enabled === "True");
      }
      console.log('finished');
  }

  static async mergeSettingsIntoDolphinIni(buildPath, settings) {
    const updater = new DolphinConfigurationUpdater(buildPath);
    const config = updater.loadConfiguration();
    _.merge(config, settings);
    return updater.saveConfiguration(config);
  }

  static forEachIsoEntries(config, callback){
	  if (!config.General) {
		  return;
	  }
	  let hasIsoEntry = false;
	  let entryNumber = 0;
	  do {
		  const currentIsoPathName = `ISOPath${entryNumber}`;
		  if (config.General[currentIsoPathName]) {
			  hasIsoEntry = true;
              callback(config.General[currentIsoPathName], currentIsoPathName, entryNumber);
		  } else {
			  hasIsoEntry = false;
		  }
		  entryNumber++;
	  } while (hasIsoEntry);
  }

  static async updateInitialSettings(
    buildPath,
    { romPaths, searchRomSubdirectories, allowDolphinAnalytics }
  ) {
    const updater = new DolphinConfigurationUpdater(buildPath);
    const config = updater.loadConfiguration();
    if (!config.General) {
      config.General = {};
    }
    console.log('the rom paths', romPaths);
    if (!_.isEmpty(romPaths)) {

      DolphinConfigurationUpdater.forEachIsoEntries(config, (isoPath, currentIsoPathName) => {
          console.log(`removing ${currentIsoPathName} ${config.General[currentIsoPathName]}`);
	      delete config.General[currentIsoPathName];
      });

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
    if (!config.Analytics) {
      config.Analytics = {};
    }
    console.log('Updating analytics settings');
    config.Analytics.Enabled = allowDolphinAnalytics ? 'True' : 'False';
    config.Analytics.PermissionAsked = 'True';

    // Set Search Subdirectories Checkbox
    if (searchRomSubdirectories !== null) {
      console.log('Setting search recursively', searchRomSubdirectories);
      config.General.RecursiveISOPaths = searchRomSubdirectories
        ? 'True'
        : 'False';
    }
    updater.saveConfiguration(config);
    return true;
  }
}
