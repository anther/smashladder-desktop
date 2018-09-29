import SlippiGame from 'slp-parser-js';
import _ from 'lodash';
import  path from "path";
import moment from 'moment';
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
		else
		{
			return this._fileDate = null; // Return really old date...
		}
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
			const characters = [];
			this.settings.players.forEach((player)=> {
				characters.push(player.character);
			});
			const stage = this.settings.stage;

			return `${characters.map(character=>character.name).join(` vs `)} on ${stage.name} - ${this.metadata.lastFrame.asTime()}`;
		}
	}

	isReadable(){
		this.parseMetadata();
		return this.game && !this.hasErrors();
	}

	getStats(){
		if(this.isReadable())
		{
			return null;
		}
		if(this.stats === null){
			this.stats = this.game.getStats();
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

	parseMetadata(){
		if(this.game !== null)
		{
			return;
		}
		try
		{
			const game = new SlippiGame(this.id);
			this.settings = game.getSettings();
			this.metadata = game.getMetadata();

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
			this.settings.players[index].character = MeleeCharacter.retrieve(player.characterId);
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

	toString(){
		return this.id;
	}

}