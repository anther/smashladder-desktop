import fs from "fs";
import hazardous from 'hazardous';
import path from "path";

const { dialog, app } = require('electron').remote;

export class Files
{

	static _openDialogSelectOne(options){
		return new Promise((resolve, reject)=>{
			dialog.showOpenDialog(options, (paths)=>{
				if(paths && paths.length > 0)
				{
					return resolve(paths[0]);
				}
				else
				{
					return null;
				}
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
			properties: ['openFile']});
	}

	static selectDirectory(defaultPath = ''){
		return Files._openDialogSelectOne({
			defaultPath,
			properties: ['openDirectory']});
	}

	static makeFilenameSafe(fileName){
		const sanitize = require("sanitize-filename");
		return sanitize(fileName);
	}

	static ensureDirectoryExists(path, mask = 0o755, cb) {
		return new Promise((resolve, reject)=>{
			fs.mkdir(path, mask, function(err){
				if(err)
				{
					if(err.code == 'EEXIST')
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

	static findInDirectory(startPath, filter, callback){
		var results = [];

		if (!fs.existsSync(startPath)){
			throw new Error('Start directory not found '+startPath);
		}

		var files=fs.readdirSync(startPath);
		for(var i=0;i<files.length;i++){
			var filename=path.join(startPath,files[i]);
			var stat = fs.lstatSync(filename);
			if (stat.isDirectory()){
				results = results.concat(Files.findInDirectory(filename,filter)); //recurse
			}
			else if (filename.indexOf(filter)>=0) {
				console.log('-- found: ',filename);
				results.push(filename);
			}
		}
		return results;
	}
}