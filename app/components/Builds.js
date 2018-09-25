import React, {Component} from 'react';

import {SmashLadderAuthentication} from "../utils/SmashLadderAuthentication";
import {BuildData} from "../utils/BuildData";
import {Files} from "../utils/Files";
import {BuildLaunchAhk} from "../utils/BuildLaunchAhk";

import {BuildComponent} from "./BuildComponent";
import Layout from "./common/Layout";

export default class Builds extends Component {
	constructor(props){
		super(props);
		this.onSetBuildPath = this.setBuildPath.bind(this);
		this.onUnsetBuildPath = this.unsetBuildPath.bind(this);
		this.buildLauncher = new BuildLaunchAhk();
		this.authentication = SmashLadderAuthentication.create(this.props.loginCode);
	}

	unsetBuildPath(build, event){
		event.preventDefault();
		this.props.setBuildPath(build, null);
	}

	setBuildPath(build, event){
		Files.selectFile(build.path)
			.then((path)=>{
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
		const { builds, buildError} = this.props;
		const buildData = BuildData.create({builds});
		return (
			<Layout
				setReplayPath={this.props.setReplayPath}
				authentication={this.authentication}
				replayPath={this.props.replayPath}

				launchBuild={this.props.launchBuild}
				hostBuild={this.props.hostBuild}
				joinBuild={this.props.joinBuild}
				closeDolphin={this.props.closeDolphin}
			>
				<div className='builds collection'>
					{buildData.hasBuilds() &&
						<div className=''>
							{buildData.getBuilds().map((build)=>
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
									closeDolphin={this.props.closeDolphin}
									buildOpen={this.isActiveBuild(build) && this.props.buildOpen}
									buildOpening={this.isActiveBuild(build) && this.props.buildOpening}
									hostCode={this.isActiveBuild(build) && this.props.hostCode}
									buildError={(buildError && buildError.for === build.id) ? buildError.error: null}

								/>
							)}
						</div>
					}
				</div>
			</Layout>
		);
	}
}
