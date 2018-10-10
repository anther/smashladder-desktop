// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Builds from '../components/Builds';
import * as BuildActions from '../actions/builds';
import * as ReplayActions from '../actions/replays';
import * as DolphinSettingsActions from '../actions/dolphinSettings';
import * as AutoUpdateActions from '../actions/autoUpdates';
import * as ReplayWatchActions from '../actions/replayWatch';
import * as DolphinStatusActions from '../actions/dolphinStatus';
import * as ReplayBrowseActions from '../actions/replayBrowse';
import * as LoginActions from '../actions/login';
import WebsocketComponent from '../components/WebsocketComponent';
import ReplaySync from '../components/ReplaySync';
import DolphinSettings from '../components/DolphinSettings';
import { SmashLadderAuthentication } from '../utils/SmashLadderAuthentication';
import Header from '../components/common/Header';
import Layout from '../components/common/Layout';
import ReplayBrowser from '../components/ReplayBrowser';
import AutoUpdates from '../components/AutoUpdates';

class BuildsPage extends Component<Props> {
  constructor(props) {
    super(props);
    this.state = {
      loginCode: null,
      productionUrls: null
    };

    this.props.initializeAutoUpdater();
    this.props.initializeBuildLauncher();
    this.props.beginWatchingForReplayChanges();
  }

  static getDerivedStateFromProps(props, state) {
    if (
      props.loginCode !== state.loginCode ||
      props.productionUrls !== state.productionUrls
    ) {
      return {
        loginCode: props.loginCode,
        productionUrls: props.productionUrls,
        authentication: SmashLadderAuthentication.create({
          loginCode: props.loginCode,
          session_id: props.sessionId,
          productionUrls: props.productionUrls
        })
      };
    }
    return null;
  }

  renderConnectionSettings(props) {
    return (
      <div className="container connecties">
        <div className="row">
          <div className="connections">
            <h5>Connections</h5>
            <WebsocketComponent {...props} />
            <ReplaySync {...props} />
          </div>
          <div className="dolphin_settings">
            <h5>Dolphin Settings</h5>
            <DolphinSettings {...props} />
          </div>
        </div>
      </div>
    );
  }

  render() {
    const props = {
      ...this.props,
      ...this.state
    };
    const { activeUpdate, allReplays } = props;

    let sideBar = null;
    let bottomContent = null;
    const connectionInformation = this.renderConnectionSettings(props);
    if (allReplays.size > 0) {
      sideBar = <ReplayBrowser {...props} />;
      bottomContent = connectionInformation;
    } else {
      sideBar = connectionInformation;
    }

    return (
      <React.Fragment>
        <Layout>
          <Header {...props} />
          {!activeUpdate && (
            <React.Fragment>
              <div className="col m8">
                <Builds {...props} />
              </div>
              <div className="col m4 sidebar">{sideBar}</div>
            </React.Fragment>
          )}
        </Layout>
        {!activeUpdate && <div className="bottom_bar">{bottomContent}</div>}
        {activeUpdate && (
          <div className="row">
            <div className="container">
              <AutoUpdates {...props} />
            </div>
          </div>
        )}
      </React.Fragment>
    );
  }
}

const mapStateToProps = state => ({
  ...state.login,
  ...state.builds,
  ...state.dolphinSettings,
  ...state.replays,
  ...state.autoUpdates,
  ...state.replayWatch,
  ...state.replayBrowse
});

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      ...BuildActions,
      ...DolphinSettingsActions,
      ...ReplayActions,
      ...AutoUpdateActions,
      ...ReplayWatchActions,
      ...ReplayBrowseActions,
      ...DolphinStatusActions,
      ...LoginActions
    },
    dispatch
  );
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BuildsPage);
