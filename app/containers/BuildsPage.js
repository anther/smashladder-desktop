// @flow
import React, { Component } from 'react';
import Builds from '../components/Builds';
import * as BuildActions from '../actions/builds';
import { setCheckForReplays } from '../actions/replays';
import * as FileActions from '../actions/filePaths';
import {
	disableConnection,
	enableConnection,
	enableDevelopmentUrls,
	enableProductionUrls,
	logout
} from '../actions/login';

import {connect} from "react-redux";
import {bindActionCreators} from "redux";

type Props = {};

class BuildsPage extends Component<Props> {
	constructor(props: Props){
		super(props);
	}

	render() {
		return <Builds
			{...this.props}
		/>;
	}
}

const mapStateToProps = state => {
	return {
		...state.login,
		...state.builds,
		filePaths: {...state.filePaths},
		checkForReplays: state.replays.checkForReplays
	}
};

function mapDispatchToProps(dispatch) {
	return bindActionCreators({
		setCheckForReplays,
		...BuildActions,
		...FileActions,
		logout,
		enableConnection,
		enableDevelopmentUrls,
		enableProductionUrls,
		disableConnection},
		dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(BuildsPage);