import React, {Component} from 'react';

import _ from 'lodash';
import {Redirect} from "react-router";
import {SmashLadderAuthentication} from "../utils/SmashLadderAuthentication";
import {Files} from "../utils/Files";

import BuildComponent from "./BuildComponent";
import Layout from "./common/Layout";
import ProgressIndeterminate from "./elements/ProgressIndeterminate";

export default class Builds extends Component {
	constructor(props){
		super(props);
		this.state = {
			loginCode: null,
			productionUrls: null,
		};
		this.onSetBuildPath = this.setBuildPath.bind(this);
		this.onUnsetBuildPath = this.unsetBuildPath.bind(this);
	}

	static getDerivedStateFromProps(props, state){
		if(props.loginCode !== state.loginCode || props.productionUrls !== state.productionUrls){

			return {
				loginCode: props.loginCode,
				authentication: SmashLadderAuthentication.create({
					loginCode: props.loginCode,
					productionUrls: props.productionUrls
				})
			}
		}
		return null;
	}

	componentDidMount(){
		this.props.retrieveBuilds();
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

	isActiveBuild(build){
		if(!this.props.activeBuild)
		{
			return false;
		}
		return this.props.activeBuild.id === build.id;
	}

	render(){
		const {builds, buildError, fetchingBuilds} = this.props;
		const { authentication } = this.state;
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
			return <Redirect to="/"/>
		}
		return (
			<Layout
				authentication={authentication}
				logout={this.props.logout}
				player={this.props.player}
				productionUrls={this.props.productionUrls}
				enableProductionUrls={this.props.enableProductionUrls}
				enableDevelopmentUrls={this.props.enableDevelopmentUrls}

				setCheckForReplays={this.props.setCheckForReplays}
				checkForReplays={this.props.checkForReplays}

				launchBuild={this.props.launchBuild}
				hostBuild={this.props.hostBuild}
				joinBuild={this.props.joinBuild}
				startGame={this.props.startGame}
				closeDolphin={this.props.closeDolphin}
				builds={this.props.builds}
				enableConnection={this.props.enableConnection}
				disableConnection={this.props.disableConnection}
				connectionEnabled={this.props.connectionEnabled}
				sessionId={this.props.sessionId}

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
								authentication={authentication}
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
