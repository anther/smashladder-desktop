// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Redirect } from 'react-router';
import Builds from '../components/Builds';
import * as BuildActions from '../actions/builds';
import * as ReplayActions from '../actions/replays';
import * as DolphinSettingsActions from '../actions/dolphinSettings';
import * as AutoUpdateActions from '../actions/autoUpdates';
import * as ReplayWatchActions from '../actions/replayWatch';
import * as DolphinStatusActions from '../actions/dolphinStatus';
import * as ReplayBrowseActions from '../actions/replayBrowse';
import * as LoginActions from '../actions/login';
import * as WindowActions from '../actions/window';
import * as LadderWebsocketActions from '../actions/ladderWebsocket';
import * as TabActions from '../actions/tabs';
import WebsocketComponent from '../components/WebsocketComponent';
import ReplaySync from '../components/ReplaySync';
import DolphinSettings from '../components/DolphinSettings';
import { SmashLadderAuthentication } from '../utils/SmashLadderAuthentication';
import Header from '../components/common/Header';
import Layout from '../components/common/Layout';
import ReplayBrowser from '../components/ReplayBrowser';
import AutoUpdates from '../components/AutoUpdates';
import Tabs from '../components/elements/Tabs';
import QuickSetup from '../components/QuickSetup';
import Button from '../components/elements/Button';

class BuildsPage extends Component<Props> {
	static renderConnectionSettings(props) {
		return (
			<div className="connecties">
				<div className="row">
					<div className="dolphin_settings col m6">
						<h5>Dolphin Settings</h5>
						<DolphinSettings {...props} />
					</div>
				</div>
			</div>
		);
	}

	constructor(props) {
		super(props);
		this.state = {
			loginCode: null,
			productionUrls: null
		};

		this.props.initializeAutoUpdater();
		this.props.initializeBuildLauncher();
		this.props.beginWatchingForReplayChanges();
		this.props.startWindowWatcher();
	}

	static getDerivedStateFromProps(props, state) {
		if (props.loginCode !== state.loginCode || props.productionUrls !== state.productionUrls) {
			return {
				loginCode: props.loginCode,
				productionUrls: props.productionUrls,
				authentication: SmashLadderAuthentication.create({
					loginCode: props.loginCode,
					sessionId: props.sessionId,
					productionUrls: props.productionUrls
				})
			};
		}
		return null;
	}

	componentDidMount() {
		this.props.ladderWebsocketConnect();
	}

	componentWillUnmount() {
		this.props.ladderWebsocketDisconnect();
	}

	render() {
		const props = {
			...this.props,
			...this.state
		};
		const { activeUpdate, allReplays, viewReplayDetails, viewingReplayDetails, player } = props;

		if (!player) {
			return <Redirect to="/"/>;
		}

		const settingsAndSuch = BuildsPage.renderConnectionSettings(props);
		const sideBar = (
			<React.Fragment>
				{!!viewingReplayDetails &&
				<div className='replay_browser detailed'>
					<div className='replay_content'>
						<Button
							onClick={viewReplayDetails.bind(null, viewingReplayDetails)}
							className="back_button btn-small"
						>
							Back
						</Button>
					</div>
				</div>
				}
				<ReplayBrowser {...props} />
			</React.Fragment>
		);
		if (activeUpdate) {
			return (
				<div className="row">
					<div className="container">
						<AutoUpdates {...props} />
					</div>
				</div>
			);
		}

		return (
			<Layout>
				<Header {...props} />
				<Tabs
					onTabChange={this.props.changeTab}
					activeTab={this.props.currentTab}>
					<div label='Home'>
						{!viewingReplayDetails && (
							<div className="col m7">
								<Builds {...props} />
							</div>
						)}
						{viewingReplayDetails && <div className="col m12">{sideBar}</div>}
						{!viewingReplayDetails && <div className="col m5 sidebar">{sideBar}</div>}
					</div>
					<div label='Settings'>
						{settingsAndSuch}
					</div>
				</Tabs>
			</Layout>
		);
	}
}

const mapStateToProps = (state) => ({
	...state.login,
	...state.builds,
	...state.dolphinSettings,
	...state.replays,
	...state.autoUpdates,
	...state.replayWatch,
	...state.replayBrowse,
	...state.ladderWebsocket,
	...state.tabs,
	...state.window,
	buildList: BuildActions.getSortedBuilds(state)
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
			...LoginActions,
			...WindowActions,
			...LadderWebsocketActions,
			...TabActions
		},
		dispatch
	);
}

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(BuildsPage);
