import React, { Component } from 'react';
import PropTypes from 'prop-types';

import _ from 'lodash';
import { Redirect } from 'react-router';

import BuildComponent from './BuildComponent';
import ProgressIndeterminate from './elements/ProgressIndeterminate';
import Build from '../utils/BuildData';

export default class Builds extends Component {
	static propTypes = {
		activeBuild: PropTypes.instanceOf(Build),
		retrieveBuilds: PropTypes.func.isRequired,
		setBuildPath: PropTypes.func.isRequired,
		builds: PropTypes.objectOf(PropTypes.instanceOf(Build)).isRequired,
		buildList: PropTypes.arrayOf(PropTypes.instanceOf(Build)).isRequired,
		buildError: PropTypes.any,
		player: PropTypes.object,
		fetchingBuilds: PropTypes.bool.isRequired,
		launchBuild: PropTypes.func.isRequired,
		joinBuild: PropTypes.func.isRequired,
		hostBuild: PropTypes.func.isRequired,
		startGame: PropTypes.func.isRequired,
		closeDolphin: PropTypes.func.isRequired,
		hostCode: PropTypes.string,
		buildOpening: PropTypes.bool.isRequired,
		buildOpen: PropTypes.bool.isRequired
	};

	static defaultProps = {
		activeBuild: null,
		buildError: null,
		player: null,
		hostCode: ''
	};

	componentDidMount() {
		this.props.retrieveBuilds();
	}

	isActiveBuild(build) {
		const { activeBuild } = this.props;
		if (!activeBuild) {
			return false;
		}
		return activeBuild.id === build.id;
	}

	render() {
		const { buildList, buildError, fetchingBuilds } = this.props;

		return (
			<React.Fragment>
				{fetchingBuilds && !buildList.length && (
					<div className="fetching_builds">
						<ProgressIndeterminate
							windowFocused={this.props.windowFocused}
						/>
						<h6>Fetching Build List</h6>
					</div>
				)}
				{(!fetchingBuilds || !!buildList.length) && (
					<div className="builds collection">
						{buildList.length > 0 && (
							<div className="">
								{buildList.map(build => (
									<BuildComponent
										key={build.dolphin_build_id}
										{...this.props}
										build={build}
										buildOpen={
											this.isActiveBuild(build) && this.props.buildOpen
										}
										buildOpening={
											this.isActiveBuild(build) && this.props.buildOpening
										}
										hostCode={
											this.isActiveBuild(build) ? this.props.hostCode : ''
										}
										buildError={
											buildError && buildError.for === build.id
												? buildError.error
												: null
										}
									/>
								))}
							</div>
						)}
						{buildList.length === 0 && (
							<div className="no_builds">
								Your SmashLadder account currently has no builds selected that can use Dolphin Launcher.
							</div>
						)}
					</div>
				)}
			</React.Fragment>
		);
	}
}
