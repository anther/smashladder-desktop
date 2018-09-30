import SlippiGame from 'slp-parser-js';
import _ from 'lodash';
import  path from "path";
import moment from 'moment';
import md5File from 'md5-file/promise';
import electronSettings from 'electron-settings';
import CacheableDataObject from "./CacheableDataObject";
import MeleeCharacter from "./replay/MeleeCharacter";
import MeleeStage from "./replay/MeleeStage";
import SmashFrame from "./replay/SlippiFrame";
import Numbers from "./Numbers";

export default class Replay extends CacheableDataObject {

	beforeConstruct(){
		this.resetData();
	}

	resetData(){
		this.stats = null;
		this.settings = {};
		this.metadata = {};
		this.game = null;
		this.hasErrors = null;
		this._md5 = null;
		this.rawData = {
			settings: {},
			metadata: {},
		};
	}

	isNewish(){
		const fileDate = this.getFileDate();
		if(!fileDate)
		{
			return false;
		}
		return fileDate.isAfter(moment().subtract(30,'minutes'));
	}

	hasDefaultFileName(){
		return this.getFileName().startsWith('Game_');
	}

	getFileDate(){
		if(this._fileDate !== undefined)
		{
			return this._fileDate;
		}
		const fileName = this.getFileName();
		if(this.hasDefaultFileName()){

			const dateString = fileName.slice(5, fileName.length - 4);
			return this._fileDate =  moment(dateString, "YYYYMMDDTHHmmss", true);
		}
		if(this.hasDirectoriedFileName())
		{
			const directory = path.basename(path.dirname(this.id));
			const dateString = fileName.slice(0, 6);
			return this._fileDate = moment(`${directory}${dateString}`, "YYYY-MM-DDHHmmss", true);
		}
		
			return this._fileDate = null; // Return really old date...
		
	}

	hasDirectoriedFileName(){
		const fileName = this.getFileName();
		for(let i = 0; i < 5; i++)
		{
			if(!Numbers.stringIsNumeric(fileName[i]))
			{
				return false;
			}
		}
		if(fileName[6] === '_')
		{
			return true;
		}
		return false;

	}

	getName(){
		this.parseMetadata();
		if(!this.isReadable())
		{
			return this.getFileName();
		}
		if(this.hasDefaultFileName())
		{
			const characters = this.getCharacters();
			const stage = this.settings.stage;

			return `${characters.map(character=>character.name).join(` vs `)} on ${stage.name} - ${this.getMatchTime()}`;
		}
	}

	getMatchTime(){
		this.parseMetadata();
		if(this.isReadable())
		{
			return this.metadata.lastFrame.asTime();
		}
		else
		{
			return '????';
		}
	}

	isReadable(){
		this.parseMetadata();
		return !this.hasErrors;
	}

	getStats(){
		if(this.isReadable())
		{
			return null;
		}
		if(this.stats === null){
			const game = this.retrieveSlippiGame();
			this.stats = game.getStats();
		}
		return this.stats;
	}

	getSettings(){
		this.parseMetadata();
		return this.settings;
	}

	getMetadata(){
		this.parseMetadata();
		return this.metadata;
	}

	getMd5(){
		if(this._md5 !== null)
		{
			return this._md5
		}
		// Prepend an M so that the key always starts with a letter
		return this._md5 = `m${md5File.sync(this.id)}`;
	}

	loadCachedSettings(){
		const settings =  electronSettings.get(`replayCache.settings.${this.getMd5()}`);
		if(settings)
		{
			this.hasSavedCachedSettings = true;
		}
		return settings;
	}

	saveCache(){
		if(this.hasSavedCachedSettings)
		{
			return;
		}
		const settings = {
			settings: this.rawData.settings,
			metadata: this.rawData.metadata,
		};
		if(settings)
		{
			this.hasSavedCachedSettings = true;
		}
		electronSettings.set(`replayCache.settings.${this.getMd5()}`, settings);
	}

	retrieveSlippiGame(){
		return new SlippiGame(this.id);
	}

	parseMetadata(){
		if(this.game !== null)
		{
			return;
		}
		try
		{
			const cachedSettings = this.loadCachedSettings();
			if(cachedSettings)
			{
				this.settings = cachedSettings.settings;
				this.metadata = cachedSettings.metadata;
				this.stats = cachedSettings.stats !== null ? cachedSettings.stats : null;
			}
			else
			{
				const game = this.retrieveSlippiGame();
				this.settings = game.getSettings();
				this.metadata = game.getMetadata();
			}

			this.rawData.settings = _.cloneDeep(this.settings);
			this.rawData.metadata = _.cloneDeep(this.metadata);
			if(!cachedSettings)
			{
				this.saveCache();
			}

			if(_.isEmpty(this.metadata))
			{
				this.hasErrors = true;
				return;
			}
		}
		catch(error)
		{
			this.hasErrors = true;
			console.error(error);
			return;
		}

		this.settings.players.forEach((player, index)=> {
			this.settings.players[index].character = MeleeCharacter.retrieve(player.characterId, player.characterColor);
		});
		this.settings.stage = MeleeStage.retrieve(this.settings.stageId);
		this.metadata.startAt = moment(this.metadata.startAt, "YYYY-MM-DDTHH:mm:ssZ", true);
		this.metadata.lastFrame = SmashFrame.createFromFameNumber(this.metadata.lastFrame);
		this.metadata.endAt = this.metadata.startAt.clone().add(this.metadata.lastFrame.seconds(), 'seconds');
	}

	getFileName(){
		return path.basename(this.id);
	}

	get filePath(){
		return this.id;
	}

	getCharacters(){
		if(this.settings && this.settings.players)
		{
			const characters = [];
			this.settings.players.forEach((player)=>{
				characters.push(player.character);
			});
			return characters;
		}
		return [];
	}

	toString(){
		return this.id;
	}

}