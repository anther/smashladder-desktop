import electronSettings from 'electron-settings';
import {
	LADDER_WEBSOCKET_BEGIN,
	LADDER_WEBSOCKET_CONNECTION_CLOSED, LADDER_WEBSOCKET_END,
	LADDER_WEBSOCKET_FORCED_TO_DISCONNECT,
	LADDER_WEBSOCKET_OPENED,
	LADDER_WEBSOCKET_STABLE,
	UPDATE_SECONDS_UNTIL_RETRY
} from '../actions/ladderWebsocket';
import { DISABLE_CONNECTION, ENABLE_CONNECTION } from '../actions/login';


const defaultState = {
	ladderWebsocketConnectionEnabled: true
};
const initialState = {
	forcedDisconnect: false,
	secondsUntilRetry: null,
	ladderWebsocketConnecting: false, // Attempting to open a connection
	ladderWebsocketConnectionOpen: false, // Open but waiting for a response
	ladderWebsocketConnectionStable: false, // Open and received a response to show that the connection is active, set to false if no pings are received,
	ladderWebsocketForcedDisconnect: false, // Long period of time with no pings, so we force a disconnect,
	ladderWebsocketConnectionEnabled: electronSettings.get('ladderWebsocket.ladderWebsocketConnectionEnabled', defaultState.ladderWebsocketConnectionEnabled)
};


export default (state = initialState, action) => {
	switch (action.type) {
		case LADDER_WEBSOCKET_BEGIN:
			return {
				...state,
				ladderWebsocketConnecting: true
			};
		case LADDER_WEBSOCKET_END:
			return {
				...state,
				ladderWebsocketConnecting: false,
				ladderWebsocketConnectionOpen: false,
				ladderWebsocketForcedDisconnect: false,
				ladderWebsocketConnectionStable: false
			};
		case LADDER_WEBSOCKET_CONNECTION_CLOSED:
			return {
				...state,
				ladderWebsocketConnecting: false,
				ladderWebsocketConnectionOpen: false,
				ladderWebsocketConnectionStable: false
			};
		case LADDER_WEBSOCKET_OPENED:
			return {
				...state,
				ladderWebsocketConnecting: false,
				ladderWebsocketConnectionOpen: true,
				ladderWebsocketForcedDisconnect: false,
				ladderWebsocketConnectionStable: false
			};
		case LADDER_WEBSOCKET_STABLE:
			return {
				...state,
				ladderWebsocketConnectionStable: true
			};

		case LADDER_WEBSOCKET_FORCED_TO_DISCONNECT:
			return {
				...state,
				ladderWebsocketForcedDisconnect: true
			};
		case ENABLE_CONNECTION:
			electronSettings.set('ladderWebsocket.ladderWebsocketConnectionEnabled', true);
			return {
				...state,
				ladderWebsocketConnectionEnabled: true
			};
		case DISABLE_CONNECTION:
			electronSettings.set('ladderWebsocket.ladderWebsocketConnectionEnabled', false);
			return {
				...state,
				ladderWebsocketConnectionEnabled: false
			};
		case UPDATE_SECONDS_UNTIL_RETRY:
			return {
				...state,
				secondsUntilRetry: action.payload
			};
		default: {
			return state;
		}
	}
}