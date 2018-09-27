import { endpoints, SmashLadderAuthentication } from "../utils/SmashLadderAuthentication";
import electronSettings from "electron-settings";
import getAuthenticationFromState from "../utils/getAuthenticationFromState";

export const SET_LOGIN_KEY = 'SET_LOGIN_KEY'
export const INVALID_LOGIN_KEY = 'INVALID_LOGIN_KEY';

export const LOGIN_BEGIN = 'LOGIN_BEGIN';
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
export const LOGIN_FAIL = 'LOGIN_FAIL';

export const LOGOUT_BEGIN = 'LOGOUT_BEGIN';
export const LOGOUT_SUCCESS = 'LOGOUT_SUCCESS';
export const LOGOUT_FAIL = 'LOGOUT_FAIL';

export const ENABLE_CONNECTION = 'ENABLE_CONNECTION';
export const DISABLE_CONNECTION = 'DISABLE_CONNECTION';

export const ENABLE_PRODUCTION_URLS = 'ENABLE_PRODUCTION_URLS';
export const ENABLE_DEVELOPMENT_URLS = 'ENABLE_DEVELOPMENT_URLS';

export const setLoginKey = (loginCode) => {
	return (dispatch, getState) => {
		const currentState = getState();
		const authentication = SmashLadderAuthentication.create({
			loginCode,
			productionUrls: currentState.login.productionUrls
		});
		const state = {
			loginCode: loginCode,
		};
		if(!authentication.getAccessCode())
		{
			dispatch({
				type: INVALID_LOGIN_KEY,
				payload: {
					...state,
					loginErrors: ['Invalid Key']
				}
			});
			return;
		}
		dispatch({
			type: LOGIN_BEGIN,
			payload: {
				...state,
				player: null,
				isLoggingIn: true,
				loginErrors: []
			}
		});
		authentication
			.isAuthenticated()
			.then(() => {
				const saveDatas = {};
				saveDatas.loginCode = loginCode;
				saveDatas.sessionId = authentication.session_id;
				saveDatas.player = authentication.player;
				electronSettings.set('login', saveDatas);
				dispatch({
					type: LOGIN_SUCCESS,
					payload: {
						...state,
						player: authentication.player,
						isLoggingIn: false,
						sessionId: authentication.session_id
					},
				});
			})
			.catch(response => {
				let error = null;
				if(response.statusCode === 401)
				{
					error = 'Invalid Code, Maybe it expired?';
				}
				else
				{
					try
					{
						error = JSON.parse(response.error);
						if(error.error)
						{
							error = error.error;
						}
					}
					catch(parseError)
					{
						error = `Something is probably wrong with SmashLadder's server's right now, please try again later!`;
					}
				}
				if(typeof error === 'string')
				{
					error = [error];
				}
				dispatch({
					type: LOGIN_FAIL,
					payload: {
						...state,
						player: null,
						loginErrors: error,
						isLoggingIn: false,
						showLoginButton: true,
					}
				});
			});
	}
};

export const enableProductionUrls = () => {
	return {
		type: ENABLE_PRODUCTION_URLS
	};
};

export const enableDevelopmentUrls = () => {
	return {
		type: ENABLE_DEVELOPMENT_URLS
	};
};

export const disableConnection = () => (dispatch) => {
	dispatch({
		type: DISABLE_CONNECTION
	});
};
export const enableConnection = () => (dispatch) => {
	dispatch({
		type: ENABLE_CONNECTION
	});
};

export const logout = () => (dispatch, getState) => {
	const authentication = getAuthenticationFromState(getState);
	dispatch({
		type: LOGOUT_BEGIN
	});
	electronSettings.set('login', null)
	authentication.apiPost(endpoints.LOGOUT, { logout: true }).then(() => {
		dispatch({
			type: LOGOUT_SUCCESS
		})
	}).catch(() => {
		dispatch({
			type: LOGOUT_FAIL
		})
	});
};