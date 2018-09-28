import fs from "fs";
// eslint-disable-next-line no-unused-vars
import hazardous from 'hazardous';// This rewrites path for app.asar && needs to be before Path declaration
import path from "path";

import sanitize from "sanitize-filename";

const { dialog, app } = require('electron').remote;

export default class Files {

	static _openDialogSelectOne(options){
		return new Promise((resolve) => {
			dialog.showOpenDialog(options, (paths) => {
				if(paths && paths.length > 0)
				{
					return resolve(paths[0]);
				}
				return resolve(null);
			});
		})
	}

	static createApplicationPath(location){
		let appPath = app.getAppPath();

		const isDev = process.env.NODE_ENV === "development";
		if(isDev)
		{
			appPath = './app';
		}
		return path.join(appPath, location);
	}

	static selectFile(defaultPath = ''){
		return Files._openDialogSelectOne({
			defaultPath,
			properties: ['openFile']
		});
	}

	static selectDirectory(defaultPath = ''){
		return Files._openDialogSelectOne({
			defaultPath,
			properties: ['openDirectory']
		});
	}

	static makeFilenameSafe(fileName){
		return sanitize(fileName);
	}

	static ensureDirectoryExists(directoryPath, mask = 0o755){
		return new Promise((resolve, reject) => {
			fs.mkdir(directoryPath, mask, (err) => {
				if(err)
				{
					if(err.code === 'EEXIST')
					{
						resolve();
					}
					else
					{
						reject(err);
					}
				}
				else
				{
					resolve();
				}
			});
		})
	}

	static findInDirectory(startPath, filter){
		let results = [];

		if(!fs.existsSync(startPath))
		{
			throw new Error(`Start directory not found ${startPath}`);
		}

		const files = fs.readdirSync(startPath);
		for(let i = 0; i < files.length; i++)
		{
			const filename = path.join(startPath, files[i]);
			const stat = fs.lstatSync(filename);
			if(stat.isDirectory())
			{
				results = results.concat(Files.findInDirectory(filename, filter)); // recurse
			}
			else if(filename.endsWith(filter))
			{
				console.log('-- found: ', filename);
				results.push(filename);
			}
		}
		return results;
	}
}