import {endpoints, SmashLadderAuthentication} from "../utils/SmashLadderAuthentication";
import electronSettings from "electron-settings";
import getAuthenticationFromState from "../utils/getAuthenticationFromState";

export const SET_LOGIN_KEY = 'SET_LOGIN_KEY'
export const VERIFY_LOGIN = 'VERIFY_LOGIN';
export const LOGIN_VERIFIED = 'LOGIN_VERIFIED';
export const LOGIN_FAILED = 'LOGIN_FAILED';
export const INVALID_LOGIN_KEY = 'INVALID_LOGIN_KEY';

export const LOGOUT_BEGIN = 'LOGOUT_BEGIN';
export const LOGOUT_SUCCESS = 'LOGOUT_SUCCESS';
export const LOGOUT_FAIL = 'LOGOUT_FAIL';

export const setLoginKey = (loginCode) =>{
	return (dispatch) =>{
		const authentication = SmashLadderAuthentication.create({loginCode});
		const state = {
			loginCode: loginCode,
		};
		if(!authentication._getAccessCode())
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
		authentication
			.isAuthenticated()
			.then((authentication) => {
				console.log(authentication);
				electronSettings.set('login.loginCode', loginCode)
				electronSettings.set('login.sessionId', authentication.session_id);
				dispatch({
					type: LOGIN_VERIFIED,
					payload: {
						...state,
						player: authentication.player,
						isLoggingIn: false
					},
				});
			})
			.catch(response => {
				dispatch({
					type: LOGIN_FAILED,
					payload: {
						...state,
						player: null,
						loginErrors: response,
						isLoggingIn: false,
					}
				});
			});
		dispatch({
			type: VERIFY_LOGIN,
			payload: {
				...state,
				player: null,
				isLoggingIn: true,
				loginErrors: []
			}
		});
	}
};

export const logout = () => (dispatch, getState) => {
	const authentication = getAuthenticationFromState(getState);
	dispatch({
		type: LOGOUT_BEGIN
	});
	electronSettings.set('login.loginCode', null)
	electronSettings.set('login.sessionId', null);
	authentication.apiPost(endpoints.LOGOUT).then(()=>{
		dispatch({
			type: LOGOUT_SUCCESS
		})
	}).catch(()=>{
		dispatch({
			type: LOGOUT_FAIL
		})
	});
};