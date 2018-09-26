import {
	SET_LOGIN_KEY,
	LOGIN_FAIL,
	LOGIN_SUCCESS,
	LOGIN_BEGIN,
	INVALID_LOGIN_KEY,
	LOGOUT_BEGIN,
	DISABLE_CONNECTION,
	ENABLE_CONNECTION
} from '../actions/login';

import electronSettings from 'electron-settings';

const loginDatas = electronSettings.get('login') || {};
const initialState = {
	loginErrors: [],
	player: loginDatas.player || null,
	loginCode: loginDatas.loginCode || null,
	sessionId: loginDatas.sessionId || null,
	connectionEnabled: true,
};

export default (state = initialState, action) => {
	switch(action.type)
	{
		case ENABLE_CONNECTION:
			return {
				...state,
				connectionEnabled: true
			};
		case DISABLE_CONNECTION:
			return {
				...state,
				connectionEnabled: false
			};
		case LOGOUT_BEGIN:
			return {
				...state,
				loginCode: null,
				sessionId: null,
				player: null,
			};
		case LOGIN_SUCCESS:
		case SET_LOGIN_KEY:
		case LOGIN_FAIL:
		case INVALID_LOGIN_KEY:
		case LOGIN_BEGIN:
			return {
				...state,
				...action.payload,
			};
		default:
			return state;
	}
}