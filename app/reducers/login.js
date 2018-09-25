import {
	SET_LOGIN_KEY,
	LOGIN_FAILED,
	LOGIN_VERIFIED,
	VERIFY_LOGIN,
	INVALID_LOGIN_KEY,
	LOGOUT_BEGIN
} from '../actions/login';

import electronSettings from 'electron-settings';

const loginDatas = electronSettings.get('login') || {};
const initialState = {
	loginErrors: [],
	player: loginDatas.player || null,
	loginCode: loginDatas.loginCode || null,
	sessionId: loginDatas.sessionId || null,
};

export default (state = initialState, action) =>{
	switch(action.type){
		case LOGOUT_BEGIN:
			return{
				...state,
				loginCode: null,
				sessionId: null,
			};
		case LOGIN_VERIFIED:
		case SET_LOGIN_KEY:
		case LOGIN_FAILED:
		case INVALID_LOGIN_KEY:
		case VERIFY_LOGIN:
			return {
				...state,
				...action.payload,
			};
		default:
			return state;
	}
}