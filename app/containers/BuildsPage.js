// @flow
import React, { Component } from 'react';
import Builds from '../components/Builds';
import { retrieveBuilds, setBuildPath } from '../actions/builds';
import { setReplayPath } from '../actions/replays';

import {connect} from "react-redux";

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
		replayPath: state.replays.path
	}
};

export default connect(mapStateToProps, { retrieveBuilds, setBuildPath, setReplayPath } )(BuildsPage);