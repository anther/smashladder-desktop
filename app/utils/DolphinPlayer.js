export class DolphinPlayer
{
	/** SLOTS MAY CHANGE, so do not store the instance */
	constructor(name, slot){
		this.name = null;
		this.previousUsername = null;
		this.isNew = true;
		this.ping = new DolphinPlayerPing();

		if(!slot)
		{
			throw new Error('Invalid slot construct');
		}

		this.setUsername(name);
		this.slot = slot;
	}

	setPing(ping){
		this.ping.addPing(ping);
	}

	getAliasName(){
		if(this.getUsername())
		{
			return this.getUsername();
		}
		else
		{
			return 'No One!';
		}
	}

	getUsername(){
		return this.name;
	}

	setUsername(username){
		if(this.name !== username)
		{
			if(username === null)
			{
				this.previousUsername = this.name;
			}
			this.hasNewUsername = true;
			this.ping.reset();
		}
		else
		{
			this.hasNewUsername = false;
		}
		this.name = username;
		// console.trace('Dolphin player', this.getAliasName(), this.slot);
		// this.element.findCache('.username').cacheText(this.getAliasName());
	}

	usernameIs(username){
		if(this.name === null)
		{
			return false;
		}
		return this.name.trim().toLowerCase() == username.trim().toLowerCase();
	}

	static parseDolphinPlayerList(value = ''){
		DolphinPlayer.lastParsedList = value;
		if(!DolphinPlayer.hasSetPlayers)
		{
			DolphinPlayer.hasSetPlayers = true;
			DolphinPlayer.parseDolphinPlayerList('');
		}
		const valueSplit = value.split(/\r?\n/);

		// MatchGame.resetPlayerList();


		const changedPlayers = {};
		for(var i in valueSplit)
		{
			if(!valueSplit.hasOwnProperty(i))
				continue;
			var current = valueSplit[i];
			if(!current.includes("["))
			{
				continue;
			}
			let nextLine = parseInt(i,10)+1;
			let pingLine = valueSplit[nextLine];
			let ping = null;
			if(pingLine)
			{
				let pingTitle = pingLine.substring(0, pingLine.lastIndexOf(":"));
				let pingSide = pingLine.substring(pingLine.lastIndexOf(":")+1);
				ping = Number.parseInt(pingSide);
			}

			let usernameData = DolphinPlayer.parseUsernameInfo(current);
			for(let portIndexes in usernameData.ports)
			{
				if(!usernameData.ports.hasOwnProperty(portIndexes))
				{
					continue;
				}
				let slot = usernameData.ports[portIndexes];
				changedPlayers[slot] = DolphinPlayer.setPlayer(slot, usernameData.username);
				changedPlayers[slot].ping.addPing(ping);
			}
		}
		DolphinPlayer.updateChangedPlayers(changedPlayers);

		return changedPlayers;
	}

	static parseUsernameInfo(current){
		const usernameSide = current.substring(0, current.lastIndexOf(":"));
		const systemInfoSide = current.substring(current.lastIndexOf(":")+1);

		const ports = systemInfoSide.substring(systemInfoSide.indexOf('|')+1, systemInfoSide.lastIndexOf('|')-1).trim();
		const systemInformation = systemInfoSide.substring(0, systemInfoSide.indexOf('|')).trim();

		const portIndexes = [];
		for (var characterIndex = 0; characterIndex < ports.length; characterIndex++) {
			if(ports.charAt(characterIndex) == '-')
			{
				continue;
			}
			portIndexes.push(characterIndex+1);
		}
		let slot = null;
		if(portIndexes.length)
		{
			slot = portIndexes[0];
		}
		const username = usernameSide.substring(0,usernameSide.lastIndexOf("[")).trim();
		return {
			username,
			ports: portIndexes
		}
	}

	static updateChangedPlayers(changedPlayers = {}){
		let changedUsernames = {};
		let hasNewUsernames = false;
		for(let [slot,_] of DolphinPlayer.possiblePlayers)
		{
			if(!changedPlayers[slot])
			{
				let player = DolphinPlayer.setPlayer(slot,null);
				if (player.hasNewUsername)
				{
					changedPlayers[slot] = player;
				}
			}

			if(changedPlayers[slot])
			{
				let changedPlayer = changedPlayers[slot];
				if(changedPlayer.hasNewUsername)
				{
					hasNewUsernames = true;
					changedUsernames[slot] = {
						username: changedPlayer.getUsername(),
						previousUsername: changedPlayer.previousUsername,
						slot: slot,
						ping: changedPlayer.ping.getList(),
					};
				}
			}
		}

		if(hasNewUsernames)
		{
			let sendData = {};
			sendData.players = changedUsernames;
			DolphinPlayer.smashladderApi.apiv1Post(DolphinPlayer.constants.apiv1Endpoints.DOLPHIN_PLAYER_JOINED, sendData)
				.catch(function(response){
					console.error(response);
				});
		}
		else
		{
		}
	}

	static retrievePlayer(slot){
		if(!slot)
		{
			throw new Error('Invalid slot');
		}
		if(DolphinPlayer.playerElements[slot])
		{
			DolphinPlayer.playerElements[slot].isNew = false;
			return DolphinPlayer.playerElements[slot];
		}
		else
		{
			return DolphinPlayer.playerElements[slot] = new DolphinPlayer(null, slot);
		}
	}

	static setPlayer(slot, name){
		var dolphinPlayer = DolphinPlayer.retrievePlayer(slot);
		dolphinPlayer.setUsername(name);
		return dolphinPlayer;
	}

	static reset(){
		DolphinPlayer.hasSetPlayers = false;
		DolphinPlayer.playerElements = {};
		if(DolphinPlayer.dolphinPlayerContainer)
		{
			DolphinPlayer.dolphinPlayerContainer.empty();
		}
	}

}
DolphinPlayer.lastParsedList = '';
DolphinPlayer.reset();
DolphinPlayer.smashladderApi = null;
DolphinPlayer.constants = null;
DolphinPlayer.possiblePlayers = new Map([
	[1, null],
	[2, null],
	[3, null],
	[4, null]
]);


class DolphinPlayerPing{

	constructor(){
		this.pingList = [];
	}

	addPing(ping){
		if(this.pingList.length > 10)
		{
			this.pingList.shift();
		}
		this.pingList.push(ping);
	}

	getList(){
		return this.pingList;
	}

	getAverage(){
		if(!this.pingList.length)
		{
			return null;
		}
		let total = null;
		for (const pingNumber of this.pingList)
		{
			total += pingNumber;
		}
		return total / this.pingList.length;
	}

	reset(){
		this.pingList = [];
	}
}