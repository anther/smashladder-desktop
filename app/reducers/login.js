import {SET_LOGIN_KEY, LOGIN_FAILED, LOGIN_VERIFIED, VERIFY_LOGIN, INVALID_LOGIN_KEY} from '../actions/login';

import electronSettings from 'electron-settings';

const initialState = {
	player: null,
	loginErrors: [],
	loginCode: electronSettings.get('login.loginCode')
};

export default (state = initialState, action) =>{
	switch(action.type){
		case LOGIN_VERIFIED:
			electronSettings.set('login.loginCode', state.loginCode)
		case SET_LOGIN_KEY:
		case LOGIN_FAILED:
		case INVALID_LOGIN_KEY:
		case VERIFY_LOGIN:
			return {
				...state,
				...action.payload,
			}
		default:
			return state;
	}
}