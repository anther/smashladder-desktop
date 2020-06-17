/* eslint-disable prefer-destructuring */
import _ from 'lodash';
import LadderWebsocket from '../utils/LadderWebsocket';
import getAuthenticationFromState from '../utils/getAuthenticationFromState';

import { startGame, joinBuild, closeDolphin, hostBuild } from './builds';
import { DISABLE_CONNECTION, ENABLE_CONNECTION } from './login';

export const LADDER_WEBSOCKET_BEGIN = 'LADDER_WEBSOCKET_BEGIN';
export const LADDER_WEBSOCKET_END = 'LADDER_WEBSOCKET_END';
export const LADDER_WEBSOCKET_OPENED = 'LADDER_WEBSOCKET_OPENED';
export const LADDER_WEBSOCKET_STABLE = 'LADDER_WEBSOCKET_STABLE';
export const LADDER_WEBSOCKET_CONNECTION_CLOSED = 'LADDER_WEBSOCKET_CONNECTION_CLOSED';
export const LADDER_WEBSOCKET_FORCED_TO_DISCONNECT = 'LADDER_WEBSOCKET_FORCED_TO_DISCONNECT';
export const UPDATE_SECONDS_UNTIL_RETRY = 'UPDATE_SECONDS_UNTIL_RETRY';

export const ladderWebsocketConnect = () => (dispatch, getState) => {
	const authentication = getAuthenticationFromState(getState);
	ladderWebsocket.setup(authentication, dispatch, getState, {
		updateSecondsUntilRetry,
		startGame,
		joinBuild,
		hostBuild,
		closeDolphin,
		disableConnection,
		ladderWebsocketBeginningConnection,
		ladderWebsocketConnectionInitialOpen,
		ladderWebsocketConnectionStabilized,
		ladderWebsocketForcedToDisconnect,
		ladderWebsocketConnectionClosed
	});
	ladderWebsocket.connect();
	dispatch({
		type: LADDER_WEBSOCKET_BEGIN
	});
};

export const ladderWebsocketDisconnect = () => (dispatch) => {
	ladderWebsocket.disconnect();
	dispatch({
		type: LADDER_WEBSOCKET_END
	});
};

export const disableConnection = () => (dispatch) => {
	dispatch({
		type: DISABLE_CONNECTION
	});
	ladderWebsocket.updateWebsocketIfNecessary();
};
export const enableConnection = () => (dispatch) => {
	dispatch({
		type: ENABLE_CONNECTION
	});
	ladderWebsocket.updateWebsocketIfNecessary();
};



export const updateSecondsUntilRetry = (seconds) => {
	return ({
		type: UPDATE_SECONDS_UNTIL_RETRY,
		payload: seconds
	});
};

export const ladderWebsocketBeginningConnection = () => {
	return {
		type: LADDER_WEBSOCKET_END
	};
};
export const ladderWebsocketConnectionInitialOpen = () => {
	return {
		type: LADDER_WEBSOCKET_OPENED
	};
};
export const ladderWebsocketConnectionStabilized = () => {
	return {
		type: LADDER_WEBSOCKET_STABLE
	};
};
export const ladderWebsocketConnectionClosed = () => (dispatch) => {
	dispatch({
		type: LADDER_WEBSOCKET_CONNECTION_CLOSED
	});
	ladderWebsocket.updateWebsocketIfNecessary();
};
export const ladderWebsocketForcedToDisconnect = () => {
	return {
		type: LADDER_WEBSOCKET_FORCED_TO_DISCONNECT
	};
};

const ladderWebsocket = new LadderWebsocket();

