import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ProgressDeterminate from './elements/ProgressDeterminate';
import ProgressIndeterminate from './elements/ProgressIndeterminate';

export default class WebsocketComponent extends Component {
	static propTypes = {
		windowFocused: PropTypes.bool.isRequired,
		enableConnection: PropTypes.func.isRequired,
		disableConnection: PropTypes.func.isRequired,
		ladderWebsocketConnectionEnabled: PropTypes.bool.isRequired,
		secondsUntilRetry: PropTypes.number,
		ladderWebsocketForcedDisconnect: PropTypes.bool.isRequired,
		ladderWebsocketConnecting: PropTypes.bool.isRequired,
		ladderWebsocketConnectionOpen: PropTypes.bool.isRequired,
		ladderWebsocketConnectionStable: PropTypes.bool.isRequired
	};

	static defaultProps = {
		secondsUntilRetry: null
	};

	constructor(props) {
		super(props);
		this.enabledChange = this.enabledChange.bind(this);
	}

	enabledChange(event) {
		if (event.target.checked) {
			this.props.enableConnection();
		} else {
			this.props.disableConnection();
		}
	}

	websocketState() {
		const {
			ladderWebsocketConnectionEnabled, ladderWebsocketForcedDisconnect, secondsUntilRetry, ladderWebsocketConnectionOpen,
			ladderWebsocketConnecting, ladderWebsocketConnectionStable
		} = this.props;
		if (ladderWebsocketForcedDisconnect) {
			return 'Disconnected (Timeout)';
		}

		if (!ladderWebsocketConnectionEnabled) {
			return 'Connection Disabled';
		}

		if (ladderWebsocketConnectionStable) {
			return 'Connection Active';
		}
		if (ladderWebsocketConnectionOpen) {
			return 'Waiting for Ping...';
		}
		if (ladderWebsocketConnecting) {
			return 'Connecting...';
		}
		if (secondsUntilRetry !== null) {
			return `Reconnecting (${secondsUntilRetry}s)`;
		}
		return 'Auth Failure?';
	}

	isConnected() {
		return (
			this.props.ladderWebsocketConnectionStable
		);
	}

	render() {
		const { ladderWebsocketConnectionEnabled, windowFocused } = this.props;
		return (
			<div className="websocket">
				<div className="progress_status">
					{this.isConnected() && <ProgressDeterminate/>}
					{!this.isConnected() && (
						<ProgressIndeterminate
							color={ladderWebsocketConnectionEnabled ? null : 'red'}
							showAnimation={ladderWebsocketConnectionEnabled}
							windowFocused={windowFocused}
						/>
					)}
					<span className="connection_state">{this.websocketState()}</span>
					<div className="switch">
						<label>
							<span>Disabled</span>
							<input
								onChange={this.enabledChange}
								checked={ladderWebsocketConnectionEnabled}
								type="checkbox"
							/>
							<span className="lever"/>
							<span>Enabled</span>
						</label>
					</div>
					<span className="what_am_i">
			            A connection to SmashLadder is required in order to trigger
			            interactions with Dolphin from the Website.
					</span>
				</div>
			</div>
		);
	}
}
