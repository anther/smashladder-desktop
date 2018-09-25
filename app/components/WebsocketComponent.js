import React, {Component} from 'react';
import urlSerialize from "../utils/urlSerialize";
import ProgressDeterminate from "./elements/ProgressDeterminate";
import ProgressIndeterminate from "./elements/ProgressIndeterminate";

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
			if(data.ping)
			{
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
				return 'Connected To SmashLadder';
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
				<h6>{this.websocketState()}</h6>
				{this.websocket.readyState === 1 &&
					<ProgressDeterminate />
				}
				{this.websocket.readyState !== 1 &&
					<ProgressIndeterminate />
				}
			</div>
		)
	}


}