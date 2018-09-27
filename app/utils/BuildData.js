import fs from 'fs';
import path from 'path';
import CacheableDataObject from "./CacheableDataObject"

export default class Build extends CacheableDataObject
{
	beforeConstruct(){
		this.games = [];
	}

	addLadder(ladder){
		this.games.push(ladder);
	}

	getPossibleGames(){
		return this.games;
	}

	getPrimaryGame(){
		if(!this.games.length)
		{
			return null;
		}
		return this.games[0];
	}

	executablePath(){
		return this.path;
	}

	getSlippiPath(){
		if(!this.path)
		{
			return null;
		}
		if(this._slippiPath !== undefined)
		{
			return this._slippiPath;
		}
		const slippiPath = `${path.dirname(this.path)  }/Slippi`;
		if(fs.existsSync(slippiPath))
		{
			return this._slippiPath = slippiPath;
		}
		
			return this._slippiPath = null;
		
	}

	addGameLaunch(){

	}

	addLaunch(){

	}

	hasDownload(){
		const acceptableExtensions = {'.zip':1};
		if(!this.download_file)
		{
			return false;
		}
		const extension = require('path').extname(this.download_file).toLowerCase();
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
	];