import atob from 'atob';
import CacheableDataObject from "./CacheableDataObject";

const request = require('request-promise-native');
const ClientOAuth2 = require('client-oauth2');


export const endpoints = {
	PLAYER_PROFILE: 'player/me',
	SUBMIT_REPLAY_RESULT: 'dolphin/slippi_replay',
	LOGIN: 'dolphin/credentials_link',
	DOLPHIN_BUILDS: 'dolphin/all_builds',
	SYNC_BUILDS: 'dolphin/sync_builds',
	CLOSED_DOLPHIN: 'dolphin/closed_host',
	OPENED_DOLPHIN: 'dolphin/opened_dolphin',
	UPDATE_BUILD_PREFERENCES: 'matchmaking/update_active_build_preferences',
	DOLPHIN_HOST: 'dolphin/set_host_code',
	REPORT_MATCH_GAME: 'dolphin/report_match_game',
	RETRIEVE_MATCH_GAME_ID: 'dolphin/prepare_match_game',
	DOLPHIN_PLAYER_JOINED: 'dolphin/player_list_update',
	WEBSOCKET_URL: (productionUrls) => productionUrls === false ? 'ws://localhost:100' : 'wss://www.smashladder.com',
	LOGOUT: 'player/logout',
};

export class SmashLadderAuthentication extends CacheableDataObject {

	beforeConstruct(){
		this.player = null;
		this.loginCode = null;
		this.session_id = null;
		this.productionUrls = null;
	}

	fullEndpointUrl(endpoint){
		let SITE_URL = 'https://www.smashladder.com';
		if(this.productionUrls === false)
		{
			SITE_URL = 'http://localhost/smashladder';
		}
		const API_URL = `${SITE_URL}/api/v1`;
		if(typeof endpoint === 'string')
		{
			return `${API_URL}/${endpoint}`;
		}
		
			return endpoint(this.productionUrls);
		
	}

	parseCredentials(){
		let string = '';
		try
		{
			string = atob(this.loginCode);
		}
		catch(error)
		{
			return {
				access: null
			};
		}
		const split = string.split(':');
		return {
			access: split[1]
		};
	}

	getAccessCode(){
		const credentials = this.parseCredentials();
		return credentials.access;
	}

	apiGet(endpoint){
		return this.request({
			url: this.fullEndpointUrl(endpoint),
			method: 'GET',
		});
	}

	apiPost(endpoint, sendData){
		return this.request({
			url: this.fullEndpointUrl(endpoint),
			method: 'POST',
			form: sendData,
		});
	}

	async request(requestData){
		if(!this.getAccessCode())
		{
			throw new Error('Invalid Login Credentials');
		}
		return this._sendRequest(requestData);
	}

	_sendRequest(requestData){
		const oauthAuth = new ClientOAuth2({});
		console.log('[SEND REQUEST]', requestData);
		if(!this.getAccessCode())
		{
			throw new Error('Invalid Login Code');
		}
		const token = oauthAuth.createToken(this.getAccessCode());
		const signedRequest = token.sign(requestData);
		// console.log('['+requestData.method+']', requestData);
		return request(signedRequest)
			.then((response) => {
				try
				{
					return JSON.parse(response);
				}
				catch(error)
				{
					throw new Error(response);
				}
			});
	}

	async isAuthenticated(){
		if(this.checkValid)
		{
			console.log('[SHORTCUT CHECK]');
			return this;
		}

		return this._sendRequest({
			url: this.fullEndpointUrl(endpoints.PLAYER_PROFILE),
			method: 'GET'
		})
			.then(response => {
				this.player = response.player;
				this.session_id = response.session_id;
				return this;
			})
	}

}