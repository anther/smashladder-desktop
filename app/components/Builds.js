import React, {Component} from 'react';

import {SmashLadderAuthentication} from "../utils/SmashLadderAuthentication";
import {Files} from "../utils/Files";

import {BuildComponent} from "./BuildComponent";
import Layout from "./common/Layout";
import {Redirect} from "react-router";
import ProgressIndeterminate from "./elements/ProgressIndeterminate";

export default class Builds extends Component {
	constructor(props){
		super(props);
		this.onSetBuildPath = this.setBuildPath.bind(this);
		this.onUnsetBuildPath = this.unsetBuildPath.bind(this);
		this.authentication = SmashLadderAuthentication.create({loginCode: this.props.loginCode});
	}

	unsetBuildPath(build, event){
		event.preventDefault();
		this.props.setBuildPath(build, null);
	}

	setBuildPath(build){
		Files.selectFile(build.path)
			.then((path) => {
				if(path)
				{
					this.props.setBuildPath(build, path);
				}
			})
	}

	componentDidMount(){
		this.props.retrieveBuilds();
	}

	isActiveBuild(build){
		if(!this.props.activeBuild)
		{
			return false;
		}
		return this.props.activeBuild.id === build.id;
	}

	render(){
		const {builds, buildError, fetchingBuilds} = this.props;
		const buildList = _.values(builds).sort((a, b) => {
			if(a.path && !b.path)
			{
				return -1;
			}
			if(b.path && !a.path)
			{
				return 1;
			}
			if(a.hasDownload() && !b.hasDownload())
			{
				return -1;
			}
			if(b.hasDownload() && !a.hasDownload())
			{
				return 1;
			}
			return 0;
		});
		if(!this.props.player)
		{
			return <Redirect to={'/'}/>
		}
		return (
			<Layout
				logout={this.props.logout}
				player={this.props.player}

				setReplayPath={this.props.setReplayPath}
				authentication={this.authentication}
				replayPath={this.props.replayPath}

				launchBuild={this.props.launchBuild}
				hostBuild={this.props.hostBuild}
				joinBuild={this.props.joinBuild}
				startGame={this.props.startGame}
				closeDolphin={this.props.closeDolphin}
				builds={this.props.builds}

				updateSearchSubdirectories={this.props.updateSearchSubdirectories}
				updateRomPath={this.props.updateRomPath}
				filePaths={this.props.filePaths}
			>
				{fetchingBuilds &&
				<div className='fetching_builds'>
					<ProgressIndeterminate/>
					<h6>Fetching Build List</h6>
				</div>
				}
				{!fetchingBuilds &&
				<div className='builds collection'>
					{buildList.length > 0 &&
					<div className=''>
						{buildList.map((build) =>
							<BuildComponent
								key={build.dolphin_build_id}
								authentication={this.authentication}
								build={build}
								setBuildPath={this.props.setBuildPath}
								onSetBuildPathClick={this.onSetBuildPath}
								unsetBuildPath={this.onUnsetBuildPath}

								launchBuild={this.props.launchBuild}
								hostBuild={this.props.hostBuild}
								joinBuild={this.props.joinBuild}
								startGame={this.props.startGame}
								closeDolphin={this.props.closeDolphin}
								buildOpen={this.isActiveBuild(build) && this.props.buildOpen}
								buildOpening={this.isActiveBuild(build) && this.props.buildOpening}
								hostCode={this.isActiveBuild(build) && this.props.hostCode}
								buildError={(buildError && buildError.for === build.id) ? buildError.error : null}

							/>
						)}
					</div>
					}
				</div>
				}
			</Layout>
		);
	}
}
