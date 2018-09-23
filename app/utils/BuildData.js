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
		return Array.from(buildList.values());
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