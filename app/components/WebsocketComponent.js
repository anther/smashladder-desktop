import React, {Component} from 'react';
import urlSerialize from "../utils/urlSerialize";
import ProgressDeterminate from "./elements/ProgressDeterminate";
import ProgressIndeterminate from "./elements/ProgressIndeterminate";

import _ from 'lodash';

const noResponseTimeoutInSeconds = 50;
export class WebsocketComponent extends Component
{
	constructor(props){
		super(props);
		this.websocket = {};
		this.potentialFailure = null;
		this.state = {
			forcedDisconnect: false
		}

		this.websocketCommands = {

			selectVersion: (message) => {
				this.browserWindow.webContents.send('highlightBuild', message.data.dolphin_version.name);
			},

			startedMatch: (message) => {
				this.browserWindow.webContents.send('startedMatch', message)
			},

			hostNetplay: (message) => {
				this.props.hostBuild(message.dolphin_version, message.game_launch_name);
			},

			sendChatMessage: (message) =>{
				if (!message.data || !message.data.dolphin_version || !message.data.dolphin_version.id) {
					throw 'Dolphin Data not included';
				}
				this.browserWindow.webContents.send('sendChatMessage' , message)
			},
			startNetplay: (message) => {
				this.props.joinBuild(message.dolphin_version, message.game_launch_name);
			},

			quitDolphin: () => {
				this.props.closeDolphin();
			},

			startGame: (message) => {
				this.props.startGame();
			},

			disableConnection: (message) => {
				Authentication.load()
					.then((authentication)=> {
						if (authentication.session_id == message.data.session_id) {
							console.log('[I GET TO LIVE]');
						}
						else {
							this.emit('disableConnection');
						}
					})
					.catch(function (error) {
						console.error(error);
					});

			},

			requestAuthentication: () => {
				this.mainWindow.webContents.send('requestAuthentication');
				//After a minute or so, goes back to disable connection
			}
		};
	}

	fetchBuildFromDolphinVersion(dolphinVersion){
		return this.props.builds.find((build) => {
			return build.id === dolphinVersion.id
		});
	}

	componentDidMount(){
		this.updateWebsocketIfNecessary();
	}

	componentDidUpdate(){
		this.updateWebsocketIfNecessary();
	}

	componentWillUnmount(){
		clearTimeout(this.potentialFailure);
		if(this.websocket.readyState !== 2 || this.websocket.readyState !== 3)
		{
			this.websocket.onclose = null;
			this.websocket.close();
		}
	}

	updateWebsocketIfNecessary(){
		if(this.props.authentication &&
			(this.websocket.readyState === 1 || this.websocket.readyState === 0))
		{
			return;
		}
		if(this.websocket.close)
		{
			this.websocket.close();
		}
		var connectData = {
			access_token: this.props.authentication._getAccessCode(),
			version: '1.0.0',
			type:5,
			launcher_version: '2.0.0',
		};
		const parameters = urlSerialize(connectData);

		this.websocket = new WebSocket('ws://localhost:100?'+parameters);

		this.setState({
			connectionOpen: false,
			connecting: false
		});
		this.websocket.onopen = () => {
			this.setState({
				connectionOpen: true,
				connecting: false,
				forcedDisconnect: false
			});
			this.resetAlonenessTimer();
		};

		this.websocket.onmessage = (event) => {
			const data = event.data;
			console.log(event.data);
			this.resetAlonenessTimer();
			let message = {};
			try{
				message = JSON.parse(event.data);
			}
			catch(error)
			{
				console.error(error);
			}
			if(message.functionCall)
			{
				if(this.websocketCommands.hasOwnProperty(message.functionCall))
				{
					console.log('payload', message.data);
					if(message.data)
					{
						if(message.data.dolphin_version)
						{
							message.data.dolphin_version = this.fetchBuildFromDolphinVersion(message.data.dolphin_version);
						}
						if(message.data.game_launch_name)
						{
							const gameInfo = message.data.game_launch_name;

							gameInfo.dolphin_game_id_hint = gameInfo.launch;
							gameInfo.name = gameInfo.game;
						}
					}
					this.websocketCommands[message.functionCall](message.data);
				}
				else
				{
					console.error(`[ACTION NOT FOUND] ${message.functionCall}`);
				}
			}
		};

		this.websocket.onerror = (evt) => {
			console.error(evt.data);
		};

		this.websocket.onclose = () => {
			this.setState({
				connectionOpen: false,
				connecting: false
			});
			clearTimeout(this.potentialFailure);
		};
	}

	resetAlonenessTimer(){
		clearTimeout(this.potentialFailure);
		this.potentialFailure = setTimeout(()=>{
			this.setState({forcedDisconnect: true});
			this.websocket.close();
		}, noResponseTimeoutInSeconds * 1000);
	}

	websocketState(){
		if(this.state.forcedDisconnect)
		{
			return 'Forced Disconnect (Timeout)';
		}
		switch(this.websocket.readyState){
			case 0:
				return 'Connecting...';
			case 1:
				return 'Connection Active';
			case 2:
				return 'Closing';
			case 3:
				return 'Closed';
			default:
				return 'Authentication Failed';
		}
	}

	render(){
		return (
			<div className='websocket'>
				<div class='progress_status'>
					{this.websocket.readyState === 1 &&
						<ProgressDeterminate />
					}
					{this.websocket.readyState !== 1 &&
						<ProgressIndeterminate />
					}
					<h6 className='connection_state'>{this.websocketState()}</h6>
				</div>
			</div>
		)
	}
}