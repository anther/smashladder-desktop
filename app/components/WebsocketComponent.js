import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { LinearBackoff } from 'simple-backoff';
import urlSerialize from '../utils/urlSerialize';
import ProgressDeterminate from './elements/ProgressDeterminate';
import ProgressIndeterminate from './elements/ProgressIndeterminate';

import {
  endpoints,
  SmashLadderAuthentication
} from '../utils/SmashLadderAuthentication';
import Build from '../utils/BuildData';

const noResponseTimeoutInSeconds = 30;

export default class WebsocketComponent extends Component {
  static propTypes = {
    authentication: PropTypes.instanceOf(SmashLadderAuthentication).isRequired,
    sessionId: PropTypes.string.isRequired,
    builds: PropTypes.objectOf(PropTypes.instanceOf(Build)).isRequired,
    hostBuild: PropTypes.func.isRequired,
    joinBuild: PropTypes.func.isRequired,
    startGame: PropTypes.func.isRequired,
    closeDolphin: PropTypes.func.isRequired,
    enableConnection: PropTypes.func.isRequired,
    disableConnection: PropTypes.func.isRequired,
    connectionEnabled: PropTypes.bool.isRequired
  };

  constructor(props) {
    super(props);
    this.websocket = null;
    this.potentialFailure = null;
    this.state = {
      forcedDisconnect: false,
      secondsUntilRetry: null
    };

    this.onEnabledChange = this.enabledChange.bind(this);

    this.connectionBackoff = new LinearBackoff({
      min: 0,
      step: 5000,
      max: 600000 // 60000 = Ten Minutes
    });
    this.reconnectTimeout = null;
    this.retryingCounter = null;
    this.connectedForABitTimeout = null;

    this.websocketCommands = {
      selectVersion: () => {
        console.info('select version trigger');
      },

      startedMatch: () => {
        console.info('started match trigger');
      },

      hostNetplay: message => {
        this.props.hostBuild(message.dolphin_version, message.game_launch_name);
      },

      sendChatMessage: message => {
        if (
          !message.data ||
          !message.data.dolphin_version ||
          !message.data.dolphin_version.id
        ) {
          throw new Error('Dolphin Data not included');
        }
      },

      startNetplay: message => {
        console.log('the message', message);
        this.props.joinBuild(message.dolphin_version, message.parameters && message.parameters.host_code);
      },

      quitDolphin: () => {
        this.props.closeDolphin();
      },

      startGame: () => {
        this.props.startGame();
      },

      disableConnection: message => {
        if (String(this.props.sessionId) === String(message.session_id)) {
          console.log('[I GET TO LIVE]');
        } else {
          this.props.disableConnection();
        }
      }
    };
  }

  componentDidMount() {
    this.updateWebsocketIfNecessary();
  }

  componentDidUpdate() {
    this.updateWebsocketIfNecessary();
  }

  componentWillUnmount() {
    this.clearTimers();
    if (this.websocket) {
      if (this.websocket.readyState !== 2 || this.websocket.readyState !== 3) {
        this.websocket.onclose = null;
        this.websocket.close();
      }
    }
  }

  enabledChange(event) {
    if (event.target.checked) {
      this.props.enableConnection();
    } else {
      this.props.disableConnection();
    }
  }

  fetchBuildFromDolphinVersion(dolphinVersion) {
    return this.props.builds[dolphinVersion.id];
  }

  clearTimers() {
    clearTimeout(this.reconnectTimeout);
    clearTimeout(this.retryingCounter);
    clearTimeout(this.potentialFailure);

    this.reconnectTimeout = null;
  }

  updateWebsocketIfNecessary() {
    const { connectionEnabled } = this.props;
    if (this.websocket) {
      if (!connectionEnabled) {
        this.websocket.close();
        return;
      }
      if (
        this.websocket.readyState === WebSocket.OPEN ||
        this.websocket.readyState === WebSocket.CONNECTING
      ) {
        return;
      }
    }

    if (!this.reconnectTimeout) {
      const nextRetry = this.connectionBackoff.next();
      const estimatedWhen = new Date(Date.now() + nextRetry);
      console.log(estimatedWhen);
      this.retryingCounter = setInterval(() => {
        const time = Math.floor((estimatedWhen.getTime() - Date.now()) / 1000);
        this.setState({
          secondsUntilRetry: time > 0 ? time : 0
        });
      }, 1000);

      console.log('next retry', nextRetry);
      this.reconnectTimeout = setTimeout(() => {
        const { authentication } = this.props;
        if (this.websocket) {
          this.websocket.close();
        }

        this.clearTimers();
        const connectData = {
          access_token: authentication.getAccessCode(),
          version: '1.0.0',
          type: 5,
          launcher_version: '2.0.0'
        };
        const parameters = urlSerialize(connectData);

        this.websocket = new WebSocket(
          `${authentication.fullEndpointUrl(
            endpoints.WEBSOCKET_URL
          )}?${parameters}`
        );

        this.setState({
          connectionOpen: false,
          connecting: false
        });

        this.setWebsocketCallbacks();
      }, nextRetry);
    }
  }

  setWebsocketCallbacks() {
    this.websocket.onopen = () => {
      this.setState({
        connectionOpen: true,
        connecting: false,
        forcedDisconnect: false,
        connectionStable: false
      });
      this.connectedForABitTimeout = setTimeout(() => {
        this.setState({
          connectionStable: true
        });
        this.connectionBackoff.reset();
      }, 8000);
      this.resetAlonenessTimer();
    };

    this.websocket.onmessage = event => {
      this.resetAlonenessTimer();
      let message = {};
      try {
        message = JSON.parse(event.data);
      } catch (error) {
        console.error(error);
      }
      if(!message.functionCall){
      	return;
      }
      if(!this.websocketCommands[message.functionCall]){
	      console.error(`[ACTION NOT FOUND] ${message.functionCall}`);
      }

      try {
        console.log('payload', message.data);
        if (message.data) {
          if (message.data.dolphin_version) {
            message.data.dolphin_version = this.fetchBuildFromDolphinVersion(message.data.dolphin_version);
          }
          if (message.data.game_launch_name) {
            const gameInfo = message.data.game_launch_name;

            gameInfo.dolphin_game_id_hint = gameInfo.launch;
            gameInfo.name = gameInfo.game;
          }
          if(message.parameters)
          {
          	message.data.parameters = message.parameters;
          }
        }
        this.websocketCommands[message.functionCall](message.data);
      } catch (error) {
        console.error('websocket message error');
        console.error(error);
      }
    };

    this.websocket.onerror = evt => {
      console.error(evt);
    };

    this.websocket.onclose = () => {
      this.setState({
        connectionOpen: false,
        connecting: false
      });
      clearTimeout(this.connectedForABitTimeout);
      clearTimeout(this.potentialFailure);
    };
  }

  resetAlonenessTimer() {
    clearTimeout(this.potentialFailure);
    this.potentialFailure = setTimeout(() => {
      this.setState({ forcedDisconnect: true });
      this.websocket.close();
    }, noResponseTimeoutInSeconds * 1000);
  }

  websocketState() {
    const { connectionEnabled } = this.props;
    if (this.state.forcedDisconnect) {
      return 'Disconnected (Timeout)';
    }

    if (!connectionEnabled) {
      return 'Connection Disabled';
    }
    if (this.reconnectTimeout) {
      return `Reconnecting (${this.state.secondsUntilRetry}s)`;
    }

    if (!this.websocket) {
      return 'Waiting...';
    }
    switch (this.websocket.readyState) {
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

  isConnected() {
    return (
      this.websocket &&
      this.websocket.readyState === WebSocket.OPEN &&
      this.state.connectionStable
    );
  }

  render() {
    const { connectionEnabled } = this.props;
    return (
      <div className="websocket">
        <div className="progress_status">
          {this.isConnected() && <ProgressDeterminate />}
          {!this.isConnected() && (
            <ProgressIndeterminate color={connectionEnabled ? null : 'red'} />
          )}
          <span className="connection_state">{this.websocketState()}</span>
          <div className="switch">
            <label>
              <span>Disabled</span>
              <input
                onChange={this.onEnabledChange}
                checked={connectionEnabled}
                type="checkbox"
              />
              <span className="lever" />
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
