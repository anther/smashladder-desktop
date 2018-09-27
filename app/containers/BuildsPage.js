// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Builds from '../components/Builds';
import * as BuildActions from '../actions/builds';
import { setCheckForReplays } from '../actions/replays';
import * as DolphinSettingsActions from '../actions/dolphinSettings';
import {
  disableConnection,
  enableConnection,
  enableDevelopmentUrls,
  enableProductionUrls,
  logout
} from '../actions/login';
import WebsocketComponent from '../components/WebsocketComponent';
import ReplaySync from '../components/ReplaySync';
import DolphinSettings from '../components/DolphinSettings';
import { SmashLadderAuthentication } from '../utils/SmashLadderAuthentication';
import Header from '../components/common/Header';
import Layout from '../components/common/Layout';

class BuildsPage extends Component<Props> {
  constructor(props) {
    super(props);
    this.state = {
      loginCode: null,
      productionUrls: null
    };
  }

  static getDerivedStateFromProps(props, state) {
    if (
      props.loginCode !== state.loginCode ||
      props.productionUrls !== state.productionUrls
    ) {
      return {
        loginCode: props.loginCode,
        authentication: SmashLadderAuthentication.create({
          loginCode: props.loginCode,
          productionUrls: props.productionUrls
        })
      };
    }
    return null;
  }

  render() {
    return (
      <Layout>
        <Header
          player={this.props.player}
          logout={this.props.logout}
          enableDevelopmentUrls={this.props.enableDevelopmentUrls}
          enableProductionUrls={this.props.enableProductionUrls}
          productionUrls={this.props.productionUrls}
        />
        <Builds {...this.props} />
        <WebsocketComponent
          authentication={this.state.authentication}
          sessionId={this.props.sessionId}
          builds={this.props.builds}
          launchBuild={this.props.launchBuild}
          hostBuild={this.props.hostBuild}
          joinBuild={this.props.joinBuild}
          startGame={this.props.startGame}
          closeDolphin={this.props.closeDolphin}
          enableConnection={this.props.enableConnection}
          disableConnection={this.props.disableConnection}
          connectionEnabled={this.props.connectionEnabled}
        />
        <ReplaySync
          builds={this.props.builds}
          authentication={this.state.authentication}
          setCheckForReplays={this.props.setCheckForReplays}
          checkForReplays={this.props.checkForReplays}
          connectionEnabled={this.props.connectionEnabled}
        />
        <DolphinSettings
          addRomPath={this.props.addRomPath}
          removeRomPath={this.props.removeRomPath}
          romPaths={this.props.romPaths}
          searchRomSubdirectories={this.props.searchRomSubdirectories}
          updateSearchRomSubdirectories={
            this.props.updateSearchRomSubdirectories
          }
          allowDolphinAnalytics={this.props.allowDolphinAnalytics}
          updateAllowDolphinAnalytics={this.props.updateAllowDolphinAnalytics}
        />
      </Layout>
    );
  }
}

const mapStateToProps = state => ({
  ...state.login,
  ...state.builds,
  ...state.dolphinSettings,
  checkForReplays: state.replays.checkForReplays
});

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setCheckForReplays,
      ...BuildActions,
      ...DolphinSettingsActions,
      logout,
      enableConnection,
      enableDevelopmentUrls,
      enableProductionUrls,
      disableConnection
    },
    dispatch
  );
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BuildsPage);
