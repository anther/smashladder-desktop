/* eslint-disable no-restricted-syntax,no-else-return,prefer-destructuring,no-unused-vars,no-unreachable */

import _ from 'lodash';

export default class DolphinPlayer {
	/** SLOTS MAY CHANGE, so do not store the instance */
	constructor(name, slot) {
		this.name = null;
		this.previousUsername = null;
		this.isNew = true;
		this.ping = new DolphinPlayerPing();

		if (!slot) {
			throw new Error('Invalid slot construct');
		}

		this.setUsername(name);
		this.slot = slot;
	}

	getAliasName() {
		if (this.getUsername()) {
			return this.getUsername();
		} else {
			return 'No One!';
		}
	}

	getUsername() {
		return this.name;
	}

	setUsername(username) {
		if (this.name !== username) {
			if (username === null) {
				this.previousUsername = this.name;
			}
			this.hasNewUsername = true;
			this.ping.reset();
		} else {
			this.hasNewUsername = false;
		}
		this.name = username;
	}

	static retrievePlayer(slot) {
		if (!slot) {
			throw new Error('Invalid slot');
		}
		if (DolphinPlayer.playerElements[slot]) {
			DolphinPlayer.playerElements[slot].isNew = false;
			return DolphinPlayer.playerElements[slot];
		} else {
			return (DolphinPlayer.playerElements[slot] = new DolphinPlayer(
				null,
				slot
			));
		}
	}

	static setPlayer(slot, name) {
		const dolphinPlayer = DolphinPlayer.retrievePlayer(slot);
		dolphinPlayer.setUsername(name);
		return dolphinPlayer;
	}

	static reset() {
		DolphinPlayer.hasSetPlayers = false;
		DolphinPlayer.playerElements = {};
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

class DolphinPlayerPing {
	constructor() {
		this.pingList = [];
	}

	addPing(ping) {
		if (this.pingList.length > 10) {
			this.pingList.shift();
		}
		this.pingList.push(ping);
	}

	getList() {
		return this.pingList;
	}

	getAverage() {
		if (!this.pingList.length) {
			return null;
		}
		let total = null;
		for (const pingNumber of this.pingList) {
			total += pingNumber;
		}
		return total / this.pingList.length;
	}

	reset() {
		this.pingList = [];
	}
}
