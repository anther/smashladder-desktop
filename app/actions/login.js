import {SmashLadderAuthentication} from "../utils/SmashLadderAuthentication";

export const SET_LOGIN_KEY = 'SET_LOGIN_KEY'
export const VERIFY_LOGIN = 'VERIFY_LOGIN';
export const LOGIN_VERIFIED = 'LOGIN_VERIFIED';
export const LOGIN_FAILED = 'LOGIN_FAILED';
export const INVALID_LOGIN_KEY = 'INVALID_LOGIN_KEY';

export const setLoginKey = (loginKey) =>{
	return (dispatch) =>{
		const authentication = SmashLadderAuthentication.create(loginKey);
		const state = {
			loginCode: loginKey,
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
						loginErrors: response
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
}