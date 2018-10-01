import React, { Component } from 'react';
import path from 'path';
import PropTypes from 'prop-types';
import {
  SmashLadderAuthentication
} from '../utils/SmashLadderAuthentication';
import ProgressDeterminate from './elements/ProgressDeterminate';
import ProgressIndeterminate from './elements/ProgressIndeterminate';

export default class ReplaySync extends Component {
  static propTypes = {
    authentication: PropTypes.instanceOf(SmashLadderAuthentication).isRequired,
    replayWatchEnabled: PropTypes.bool.isRequired,
    connectionEnabled: PropTypes.bool.isRequired,
  };

  constructor(props) {
    super(props);
    this.onCheckForReplaysChange = this.checkForReplaysChange.bind(this);
    this.onSetCheckForReplaysTrue = this.updateCheckForReplays.bind(this, true);
    this.onSetCheckForReplaysFalse = this.updateCheckForReplays.bind(this, false);
  }

  updateCheckForReplays(set) {
    if(set)
    {
      this.props.enableReplayWatching();
    }
    else
    {
      this.props.disableReplayWatching();
    }
  }

  isReady() {
    const { sendingReplay } = this.props;

    return !sendingReplay;
  }

  getProgressColor() {
    const { connectionEnabled, replayWatchEnabled } = this.props;
    return connectionEnabled && replayWatchEnabled ? 'teal' : 'red';
  }

  getSyncStatusStatement() {
    const { sendingReplay, authentication,
	    lastReplaySubmissionError,
        connectionEnabled, verifyingReplayFile, replayWatchEnabled } = this.props;

    if (!authentication) {
      return {message: 'Invalid Authentication'};
    }
    if (sendingReplay) {
      return {message: 'Sending Game Data...'};
    }
    if (!connectionEnabled) {
      return {message: 'Connection Disabled'};
    }
    if (!replayWatchEnabled) {
      return {isError: true, message: '...Not Enabled...'};
    }
    if(verifyingReplayFile){
      return {message: `Watching File ${path.basename(verifyingReplayFile)}`};
    }
    if(lastReplaySubmissionError){
      return {isError: true, message: lastReplaySubmissionError};
    }
    return {message: 'Waiting'};
  }

  checkForReplaysChange(event) {
    if (event.target.checked) {
      this.onSetCheckForReplaysTrue();
    } else {
      this.onSetCheckForReplaysFalse();
    }
  }

  render() {
    const { replayWatchEnabled, lastSubmittedReplay } = this.props;
    return (
      <div className="replays">
        <div className="progress_status">
          {this.isReady() && (
            <ProgressDeterminate color={this.getProgressColor()} />
          )}
          {!this.isReady() && (
            <ProgressIndeterminate color={this.getProgressColor()} />
          )}
          <h6 className={`connection_state ${this.getSyncStatusStatement().isError ? 'error' : ''}`}>{this.getSyncStatusStatement().message}</h6>
          <div className="switch">
            <label>
              <span>No</span>
              <input
                onChange={this.onCheckForReplaysChange}
                checked={replayWatchEnabled}
                type="checkbox"
              />
              <span className="lever" />
              <span>Upload Slippi Results</span>
            </label>
          </div>
          <span className="what_am_i">
            Compatible only with Project Slippi. Your replay directory will be
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
