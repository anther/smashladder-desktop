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
		const { builds, buildError, fetchingBuilds, player } = this.props;
		const buildList = _.values(builds).sort((a, b) => {
			if (a.path && !b.path) {
				return -1;
			}
			if (b.path && !a.path) {
				return 1;
			}
			if (a.hasDownload() && !b.hasDownload()) {
				return -1;
			}
			if (b.hasDownload() && !a.hasDownload()) {
				return 1;
			}
			return 0;
		});
		if (!player) {
			return <Redirect to="/"/>;
		}
		return (
			<React.Fragment>
				{fetchingBuilds && (
					<div className="fetching_builds">
						<ProgressIndeterminate/>
						<h6>Fetching Build List</h6>
					</div>
				)}
				{!fetchingBuilds && (
					<div className="builds collection">
						{buildList.length > 0 && (
							<div className="">
								{buildList.map(build => (
									<BuildComponent
										key={build.dolphin_build_id}
										build={build}
										setBuildPath={this.props.setBuildPath}
										launchBuild={this.props.launchBuild}
										hostBuild={this.props.hostBuild}
										joinBuild={this.props.joinBuild}
										startGame={this.props.startGame}
										closeDolphin={this.props.closeDolphin}
										setDefaultPreferableNewUserBuildOptions={this.props.setDefaultPreferableNewUserBuildOptions}
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
							<div className="no_builds">I was not prepared for this</div>
						)}
					</div>
				)}
			</React.Fragment>
		);
	}
}
