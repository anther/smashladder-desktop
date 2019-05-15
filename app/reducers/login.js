import electronSettings from 'electron-settings';
import {
	LOGIN_FAIL,
	LOGIN_SUCCESS,
	LOGIN_BEGIN,
	INVALID_LOGIN_KEY,
	LOGOUT_BEGIN,
	ENABLE_DEVELOPMENT_URLS,
	ENABLE_PRODUCTION_URLS
} from '../actions/login';

const defaultLoginState = {
	player: null,
	loginCode: null,
	sessionId: null,
	productionUrls: true
};
const loginDatas = { ...defaultLoginState };
loginDatas.player = electronSettings.get('login.player', defaultLoginState.player);
loginDatas.loginCode = electronSettings.get('login.loginCode', defaultLoginState.loginCode);
loginDatas.sessionId = electronSettings.get('login.sessionId', defaultLoginState.sessionId);
loginDatas.productionUrls = electronSettings.get('login.productionUrls', defaultLoginState.productionUrls);

const initialState = {
	loginErrors: [],
	player: loginDatas.player,
	loginCode: loginDatas.loginCode,
	sessionId: loginDatas.sessionId,
	productionUrls: loginDatas.productionUrls,
	isLoggingIn: false,
	showLoginButton: false
};

console.log('what are login datas?', initialState.productionUrls, loginDatas);

export default (state = initialState, action) => {
	switch (action.type) {
		case ENABLE_DEVELOPMENT_URLS:
			electronSettings.set('login.productionUrls', false);
			return {
				...state,
				productionUrls: false
			};
		case ENABLE_PRODUCTION_URLS:
			electronSettings.set('login.productionUrls', true);
			return {
				...state,
				productionUrls: true
			};
		case LOGOUT_BEGIN:
			electronSettings.set('login', defaultLoginState);
			return {
				...state,
				...defaultLoginState,
				productionUrls: state.productionUrls
			};
		case INVALID_LOGIN_KEY:
			return {
				...state,
				loginErrors: [action.payload],
				isLoggingIn: false
			};
		case LOGIN_BEGIN:
			return {
				...state,
				loginCode: action.payload,
				player: null,
				isLoggingIn: true,
				loginErrors: []
			};
		case LOGIN_SUCCESS: {
			const { player, sessionId } = action.payload;
			electronSettings.set('login', {
				loginCode: state.loginCode,
				sessionId: sessionId,
				player: player
			});
			return {
				...state,
				player: player,
				sessionId: sessionId,
				isLoggingIn: false
			};
		}
		case LOGIN_FAIL:
			return {
				...state,
				player: null,
				loginErrors: [action.payload],
				isLoggingIn: false,
				showLoginButton: true
			};
		default:
			return state;
	}
}