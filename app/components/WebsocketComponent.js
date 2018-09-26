import React, {Component} from 'react';
import urlSerialize from "../utils/urlSerialize";
import ProgressDeterminate from "./elements/ProgressDeterminate";
import ProgressIndeterminate from "./elements/ProgressIndeterminate";

import _ from 'lodash';
import Button from "./elements/Button";

const noResponseTimeoutInSeconds = 50;

export class WebsocketComponent extends Component {
	constructor(props){
		super(props);
		this.websocket = null;
		this.potentialFailure = null;
		this.state = {
			forcedDisconnect: false
		};

		this.websocketCommands = {

			selectVersion: (message) => {
				console.info('select version trigger');
			},

			startedMatch: (message) => {
				console.info('started match trigger');
			},

			hostNetplay: (message) => {
				this.props.hostBuild(message.dolphin_version, message.game_launch_name);
			},

			sendChatMessage: (message) => {
				if(!message.data || !message.data.dolphin_version || !message.data.dolphin_version.id)
				{
					throw 'Dolphin Data not included';
				}
				this.browserWindow.webContents.send('sendChatMessage', message)
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
				if (this.props.sessionId == message.session_id)
				{
					console.log('[I GET TO LIVE]');
				}
				else
				{
					this.props.disableConnection();
				}
			},

			requestAuthentication: () => {
				this.mainWindow.webContents.send('requestAuthentication');
				//After a minute or so, goes back to disable connection
			}
		};
	}

	fetchBuildFromDolphinVersion(dolphinVersion){
		return this.props.builds[dolphinVersion.id];
	}

	componentDidMount(){
		this.updateWebsocketIfNecessary();
	}

	componentDidUpdate(){
		this.updateWebsocketIfNecessary();
	}

	componentWillUnmount(){
		clearTimeout(this.potentialFailure);
		if(this.websocket)
		{
			if(this.websocket.readyState !== 2 || this.websocket.readyState !== 3)
			{
				this.websocket.onclose = null;
				this.websocket.close();
			}
		}
	}

	updateWebsocketIfNecessary(){
		const { connectionEnabled } = this.props;
		if(this.websocket && !connectionEnabled)
		{
			this.websocket.close();
			return;
		}
		if(this.props.authentication && this.websocket &&
			(this.websocket.readyState === WebSocket.OPEN || this.websocket.readyState === WebSocket.CONNECTING))
		{
			return;
		}
		if(this.websocket && this.websocket.close)
		{
			this.websocket.close();
		}
		var connectData = {
			access_token: this.props.authentication._getAccessCode(),
			version: '1.0.0',
			type: 5,
			launcher_version: '2.0.0',
		};
		const parameters = urlSerialize(connectData);

		this.websocket = new WebSocket('ws://localhost:100?' + parameters);

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
			this.resetAlonenessTimer();
			let message = {};
			try
			{
				message = JSON.parse(event.data);
			}
			catch(error)
			{
				console.error(error);
			}
			try{
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
			}
			catch(error)
			{
				console.error('websocket message error');
				console.error(error);
			}
		};

		this.websocket.onerror = (evt) => {
			console.error(evt);
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
		this.potentialFailure = setTimeout(() => {
			this.setState({forcedDisconnect: true});
			this.websocket.close();
		}, noResponseTimeoutInSeconds * 1000);
	}

	websocketState(){
		const { connectionEnabled } = this.props;
		if(this.state.forcedDisconnect)
		{
			return 'Disconnected (Timeout)';
		}

		if(!connectionEnabled)
		{
			return 'Connection Disabled';
		}

		if(!this.websocket)
		{
			return 'Waiting...';
		}
		switch(this.websocket.readyState)
		{
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

	isConnected(){
		return this.websocket && this.websocket.readyState === WebSocket.OPEN;
	}

	render(){
		const { connectionEnabled } = this.props;
		return (
			<div className='websocket'>
				<div className='progress_status'>
					{this.isConnected() &&
					<ProgressDeterminate/>
					}
					{!this.isConnected()  &&
					<ProgressIndeterminate
						color={connectionEnabled ? null : 'red'}
					/>
					}
					<h6 className='connection_state'>{this.websocketState()}</h6>
					{!this.props.connectionEnabled &&
						<Button className='btn-small' onClick={this.props.enableConnection}>Enable</Button>
					}
					{this.props.connectionEnabled &&
						<Button className='btn-small red lighten-2' onClick={this.props.disableConnection}>Disable</Button>
					}
					<span className='what_am_i'>
						A connection to SmashLadder is required in order to trigger interactions with Dolphin from the Website.
					</span>

				</div>
			</div>
		)
	}
}