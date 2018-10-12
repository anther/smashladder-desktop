import electronSettings from 'electron-settings';
import {
	LOGIN_FAIL,
	LOGIN_SUCCESS,
	LOGIN_BEGIN,
	INVALID_LOGIN_KEY,
	LOGOUT_BEGIN,
	DISABLE_CONNECTION,
	ENABLE_CONNECTION, ENABLE_DEVELOPMENT_URLS, ENABLE_PRODUCTION_URLS
} from '../actions/login';

const defaultLoginState = {
	player: null,
	loginCode: null,
	sessionId: null,
	productionUrls: true
};
const loginDatas = electronSettings.get('login', defaultLoginState);

const initialState = {
	loginErrors: [],
	player: loginDatas.player,
	loginCode: loginDatas.loginCode,
	sessionId: loginDatas.sessionId,
	productionUrls: loginDatas.productionUrls,
	connectionEnabled: true,
	isLoggingIn: false,
	showLoginButton: false
};

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
				isLoggingIn: false,
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
				isLoggingIn: false,
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