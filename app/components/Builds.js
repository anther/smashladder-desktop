import React, { Component } from 'react';
import PropTypes from 'prop-types';

import _ from 'lodash';
import { Redirect } from 'react-router';

import BuildComponent from './BuildComponent';
import ProgressIndeterminate from './elements/ProgressIndeterminate';
import Build from '../utils/BuildData';
import AlertBox from './elements/AlertBox';
import Button from './elements/Button';
import SetMeleeIsoAlertBox from './SetMeleeIsoAlertBox';

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
		buildOpen: PropTypes.bool.isRequired,
		buildsDownloading: PropTypes.object.isRequired,
		windowFocused: PropTypes.bool.isRequired
	};

	static defaultProps = {
		activeBuild: null,
		buildError: null,
		player: null,
		hostCode: ''
	};

	componentDidMount() {
		// this.props.retrieveBuilds();
		this.props.retrieveBuildsAndInstall();
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
				{(!fetchingBuilds || buildList.length > 0) && (
					<React.Fragment>
						<SetMeleeIsoAlertBox
							{...this.props}
						/>
						<div className="builds collection">
							{buildList.length > 0 && (
								<React.Fragment>
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
											buildDownload={
												this.props.buildsDownloading[build.id]
											}
										/>
									))}
								</React.Fragment>
							)}
							{buildList.length === 0 && (
								<div className="no_builds">
									Your SmashLadder account currently has no games selected that can use Dolphin
									Launcher.
								</div>
							)}
						</div>
					</React.Fragment>
				)}
			</React.Fragment>
		);
	}
}
