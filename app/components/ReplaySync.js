import React, { Component } from 'react';
import watch from 'node-watch';
import fs from 'fs';
import path from 'path';
import SlippiGame from 'slp-parser-js';
import _ from 'lodash';
import PropTypes from 'prop-types';
import Files from '../utils/Files';
import {
  endpoints,
  SmashLadderAuthentication
} from '../utils/SmashLadderAuthentication';
import Numbers from '../utils/Numbers';
import multitry from '../utils/multitry';
import ProgressDeterminate from './elements/ProgressDeterminate';
import ProgressIndeterminate from './elements/ProgressIndeterminate';
import Build from '../utils/BuildData';

export default class ReplaySync extends Component {
  static createBetterFileName(originalFile, { others = [] }) {
    const date = new Date();
    const root = path.dirname(originalFile);

    const folder = `${root}/${date.getFullYear()}-${Numbers.forceTwoDigits(
      date.getMonth()
    )}-${Numbers.forceTwoDigits(date.getDate())}`;
    const hour = Numbers.forceTwoDigits(date.getHours());
    let usernameList = '';
    if (others.length) {
      usernameList = others
        .map(other => other.username.replace(/[^a-z0-9]/gi, '_'))
        .join('-');
      usernameList = `_with-${usernameList}`;
    } else {
      usernameList = '';
    }
    const fileName = `${hour}${Numbers.forceTwoDigits(
      date.getMinutes()
    )}${usernameList}.slp`;
    const newName = `${folder}/${fileName}`;

    Files.ensureDirectoryExists(folder, 0o755, error => {
      if (!error) {
        fs.rename(originalFile, newName, renameError => {
          if (renameError) {
            throw renameError;
          }
        });
      }
    });
  }

  static loadGame(file) {
    return multitry(500, 5, () => {
      const data = {};
      data.game = new SlippiGame(file);
      data.settings = data.game.getSettings();
      data.metadata = data.game.getMetadata();
      data.stats = data.game.getStats();
      if (!data.settings || data.settings.stageId === 0) {
        throw new Error('Invalid data');
      }
      return data;
    });
  }

  static propTypes = {
    authentication: PropTypes.instanceOf(SmashLadderAuthentication).isRequired,
    setCheckForReplays: PropTypes.func.isRequired,
    checkForReplays: PropTypes.bool.isRequired,
    connectionEnabled: PropTypes.bool.isRequired,
    builds: PropTypes.objectOf(PropTypes.instanceOf(Build)).isRequired
  };

  constructor(props) {
    super(props);
    this.onCheckForReplaysChange = this.checkForReplaysChange.bind(this);
    this.onSetCheckForReplaysTrue = this.updateCheckForReplays.bind(this, true);
    this.onSetCheckForReplaysFalse = this.updateCheckForReplays.bind(
      this,
      false
    );
    this.watcher = null;
    this.watchingPaths = [];
    this.reinitializingTimeout = null;
    this.state = {
      reinitializing: false,
      watching: null,
      sending: null,
      active: false,
      sentGame: null,
      checkForReplays: null
    };
  }

  static getDerivedStateFromProps(props, state) {
    if (props.checkForReplays !== state.checkForReplays) {
      return {
        checkForReplays: props.checkForReplays
      };
    }
    return null;
  }

  componentDidMount() {
    this.startWatchingIfSettingsAreGood();
  }

  componentDidUpdate() {
    this.startWatchingIfSettingsAreGood();
  }

  componentWillUnmount() {
    this.disableWatch();
  }

  updateCheckForReplays(set) {
    this.props.setCheckForReplays(set);
  }

  disableWatch() {
    if (this.watcher) {
      this.watcherPath = null;
      this.watcher.close();
      this.watcher = null;
    }
  }

  getWatchableSlippiPaths() {
    const { builds } = this.props;
    let paths = new Set();
    _.each(builds, build => {
      if (build.getSlippiPath()) {
        paths.add(build.getSlippiPath());
      }
    });
    paths = Array.from(paths);
    return paths;
  }

  startWatchingIfSettingsAreGood() {
    const { authentication, connectionEnabled } = this.props;
    const { checkForReplays } = this.state;
    if (!connectionEnabled) {
      return;
    }
    if (!checkForReplays) {
      this.disableWatch();
      return;
    }
    if (!authentication) {
      this.disableWatch();
      return;
    }
    const paths = this.getWatchableSlippiPaths();

    if (!_.isEqual(this.watchingPaths.sort(), paths.sort())) {
      this.watchingPaths = paths;

      // This is purely for display purposes
      clearTimeout(this.reinitializingTimeout);
      this.setState({reinitializing: `'Updating New Paths...`});
      this.reinitializingTimeout = setTimeout(()=>{
        this.setState({reinitializing: null});
      }, 2000);

      console.log('gon watch', paths);
      this.watcher = watch(paths, { recursive: false }, (event, filePath) => {
        if (event === 'remove') {
          return;
        }
        fs.lstat(filePath, (err, stats) => {
          if (err) {
            return console.log(err); // Handle error
          }

          if (stats.isFile()) {
            this.slippiGame = null;
            this.updateLastGame(filePath);
          }
        });
      });
    }
  }

  updateLastGame(file) {
    if (file && !this.slippiGame) {
      this.setState({ watching: file });
      ReplaySync.loadGame(file)
        .then(gameData => {
          this.setState({
            watching: null,
            sending: true
          });

          const game = {
            metadata: gameData.metadata,
            stats: gameData.stats,
            settings: gameData.settings
          };
          const sendData = {
            game: JSON.stringify(game),
            source: 'slippiLauncher'
          };

          console.log('sending', sendData);
          this.props.authentication
            .apiPost(endpoints.SUBMIT_REPLAY_RESULT, sendData)
            .then(response => {
              this.setState({
                sending: false,
                sentGame: gameData
              });
              if (response.other_players) {
                ReplaySync.createBetterFileName(file, {
                  others: response.other_players
                });
              }
            })
            .catch(response => {
              console.error('response failed', response);

              try{
                const parsed = JSON.parse(response.error);
                this.setState({
                    lastError: parsed.error,
                });
              }
              catch(jsonError)
              {
                this.setState({
                    lastError: 'Last Attempt Failed',
                })
              }
              this.setState({ sending: false });
            });
        })
        .catch(error => {
          console.error(error);
        });
    }
  }

  isReady() {
    const { sending } = this.state;

    return !sending;
  }

  getProgressColor() {
    const { connectionEnabled, checkForReplays } = this.props;
    return connectionEnabled && checkForReplays ? 'teal' : 'red';
  }

  getSyncStatusStatement() {
    const { authentication, connectionEnabled } = this.props;
    const { sending, checkForReplays, watching, reinitializing } = this.state;

    if (!authentication) {
      return {message: 'Invalid Authentication'};
    }
    if (sending) {
      return {message: 'Sending Game Data...'};
    }
    if(reinitializing){
      return {message: reinitializing};
    }
    if (this.slippiGame) {
      return {message: 'Sending game result'};
    }
    if (!connectionEnabled) {
      return {message: 'Connection Disabled'};
    }
    if (!checkForReplays) {
      return {isError: true, message: '...Not Enabled...'};
    }
    if(watching){
      return {message: `Watching File ${path.basename(watching)}`};
    }
    if(this.state.lastError){
      return {isError: true, message: this.state.lastError};
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
    const { checkForReplays } = this.props;
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
                checked={checkForReplays}
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
        {this.state.sentGame && (
          <h6 className="sent_game">Match Submitted Successfully</h6>
        )}
      </div>
    );
  }
}
