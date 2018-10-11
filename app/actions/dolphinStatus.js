import _ from 'lodash';
import getAuthenticationFromState from '../utils/getAuthenticationFromState';
import { endpoints } from '../utils/SmashLadderAuthentication';

export const DOLPHIN_STATUS_SEND_BEGIN = 'DOLPHIN_STATUS_SEND_BEGIN';
export const DOLPHIN_STATUS_SEND_SUCCESS = 'DOLPHIN_STATUS_SEND_SUCCESS';
export const DOLPHIN_STATUS_SEND_FAIL = 'DOLPHIN_STATUS_SEND_FAIL';


export const parseDolphinPlayerList = (value = '') => (dispatch, getState) => {
	const valueSplit = value.split(/\r?\n/);

	const { dolphinPlayers } = getState().dolphinStatus;

	const parsedUsernames = {};
	valueSplit.forEach((current, index) => {
		if (!current.includes('[')) {
			return;
		}
		const nextLine = parseInt(index, 10) + 1;
		const pingLine = valueSplit[nextLine];
		let ping = null;
		if (pingLine) {
			const pingTitle = pingLine.substring(0, pingLine.lastIndexOf(':'));
			const pingSide = pingLine.substring(pingLine.lastIndexOf(':') + 1);
			ping = Number.parseInt(pingSide, 10);
		}

		const usernameData = parseUsernameInfo(current);
		usernameData.ports.forEach((port) => {
			parsedUsernames[port] = {
				username: usernameData.username,
				slot: port
			};
		});
	});
	if (_.isEqual(parsedUsernames, dolphinPlayers)) {
		return;
	}
	const sendData = {
		players: parsedUsernames
	};
	const authentication = getAuthenticationFromState(getState);
	dispatch({
		type: DOLPHIN_STATUS_SEND_BEGIN,
		payload: parsedUsernames
	});
	authentication.apiPost(endpoints.DOLPHIN_PLAYER_JOINED, sendData)
		.then((response) => {
			console.log(response);
			dispatch({
				type: DOLPHIN_STATUS_SEND_SUCCESS
			});
		})
		.catch((error) => {
			console.error(error);
			dispatch({
				type: DOLPHIN_STATUS_SEND_FAIL,
				payload: error
			});
		});
};

const parseUsernameInfo = (current) => {
	const usernameSide = current.substring(0, current.lastIndexOf(':'));
	const systemInfoSide = current.substring(current.lastIndexOf(':') + 1);

	const ports = systemInfoSide
		.substring(
			systemInfoSide.indexOf('|') + 1,
			systemInfoSide.lastIndexOf('|') - 1
		)
		.trim();
	const systemInformation = systemInfoSide
		.substring(0, systemInfoSide.indexOf('|'))
		.trim();

	const portIndexes = [];
	for (
		let characterIndex = 0;
		characterIndex < ports.length;
		characterIndex++
	) {
		if (ports.charAt(characterIndex) === '-') {
			continue;
		}
		portIndexes.push(characterIndex + 1);
	}
	let slot = null;
	if (portIndexes.length) {
		slot = portIndexes[0];
	}
	const username = usernameSide
		.substring(0, usernameSide.lastIndexOf('['))
		.trim();
	return {
		username,
		ports: portIndexes
	};
};