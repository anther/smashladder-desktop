import React, { Component } from 'react';
import path from 'path';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {
	SmashLadderAuthentication
} from '../utils/SmashLadderAuthentication';
import ProgressDeterminate from './elements/ProgressDeterminate';
import ProgressIndeterminate from './elements/ProgressIndeterminate';
import InputSwitch from './elements/InputSwitch';

export default class ReplaySync extends Component {
	static propTypes = {
		authentication: PropTypes.instanceOf(SmashLadderAuthentication).isRequired,
		replayWatchEnabled: PropTypes.bool.isRequired,
		ladderWebsocketConnectionEnabled: PropTypes.bool.isRequired,
		sendingReplay: PropTypes.bool,
		enableReplayWatching: PropTypes.func.isRequired,
		disableReplayWatching: PropTypes.func.isRequired
	};

	static defaultProps = {
		sendingReplay: false
	};

	constructor(props) {
		super(props);
		this.enabledChange = this.enabledChange.bind(this);
	}

	enabledChange(event) {
		if (event.target.checked) {
			this.props.enableReplayWatching();
		} else {
			this.props.disableReplayWatching();
		}
	}

	updateCheckForReplays(set) {
		const { enableReplayWatching, disableReplayWatching } = this.props;
		if (set) {
			enableReplayWatching();
		} else {
			disableReplayWatching();
		}
	}

	isReady() {
		const { sendingReplay } = this.props;

		return !sendingReplay;
	}

	getProgressColor() {
		const { ladderWebsocketConnectionEnabled, replayWatchEnabled } = this.props;
		return ladderWebsocketConnectionEnabled && replayWatchEnabled ? 'teal' : 'red';
	}

	getSyncStatusStatement() {
		const {
			sendingReplay, authentication,
			lastReplaySubmissionError,
			ladderWebsocketConnectionEnabled, verifyingReplayFiles, replayWatchEnabled
		} = this.props;

		if (!authentication) {
			return { message: 'Invalid Authentication' };
		}
		if (sendingReplay) {
			return { message: 'Sending Game Data...' };
		}
		if (!ladderWebsocketConnectionEnabled) {
			return { message: 'Connection Disabled Stops Replay Uploads' };
		}
		if (!replayWatchEnabled) {
			return { isError: true, message: '...Replay Watch Disabled...' };
		}

		if (!_.isEmpty(verifyingReplayFiles)) {
			return { message: `Watching a file...!` };
		}
		if (lastReplaySubmissionError) {
			return { isError: true, message: lastReplaySubmissionError };
		}
		return { message: 'Waiting for a Replay' };
	}

	render() {
		const { lastSubmittedReplay, replayWatchEnabled, ladderWebsocketConnectionEnabled } = this.props;
		return (
			<div className="replays">
				<div className="progress_status">
					{this.isReady() && (
						<ProgressDeterminate color={this.getProgressColor()}/>
					)}
					{!this.isReady() && (
						<ProgressIndeterminate
							windowFocused={this.props.windowFocused}
							color={this.getProgressColor()}
						/>
					)}
					<h6 className={`connection_state ${this.getSyncStatusStatement().isError ? 'error' : ''}`}>{this.getSyncStatusStatement().message}</h6>
					<div className="switch">
						<InputSwitch
							enabledText='Send Replay Results'
							diabledText="Don't Send Results"
							onChange={this.enabledChange}
							disabled={!ladderWebsocketConnectionEnabled}
							checked={ladderWebsocketConnectionEnabled && replayWatchEnabled}

						/>
					</div>
					<span className="what_am_i">
			            Compatible with Project Slippi. Your replay directory will be
			            watched for new files and will automatically send the results to
			            SmashLadder.
					</span>
				</div>
				{lastSubmittedReplay && (
					<h6 className="sent_game">Match Submitted Successfully</h6>
				)}
			</div>
		);
	}
}
