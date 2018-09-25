import CacheableDataObject from "./CacheableDataObject"
import _ from 'lodash';
import electronSettings from 'electron-settings';

export class BuildData extends CacheableDataObject
{
	hasBuilds(){
		return this.getBuilds().length > 0;
	}

	getBuilds(){
		const buildList = new Map();
		const savedBuildData = electronSettings.get('builds') || {};
		_.forEach(this.builds, (buildData) =>{
			for(let build of buildData.builds){
				if(savedBuildData[build.dolphin_build_id])
				{
					build = Object.assign(savedBuildData[build.dolphin_build_id], build);
				}
				build = buildList.get(build.dolphin_build_id) || Build.create(build);
				buildList.set(build.dolphin_build_id, build);
				build.addLadder(buildData.ladder);
			}
		});
		return Array.from(buildList.values()).sort((a,b)=>{
			if(a.path && !b.path)
			{
				return -1;
			}
			if(b.path && !a.path)
			{
				return 1;
			}
			return 0;
		});
	}

	getLadders(){
		const gameList = [];
		_.forEach(this.builds, (buildData) =>{
			gameList.push(buildData.ladder);
		})
		return gameList;
	}
}

export class Build extends CacheableDataObject
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

	executablePath(){
		return this.path;
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