import React, {Component} from 'react';

import {SmashLadderAuthentication} from "../utils/SmashLadderAuthentication";
import {Files} from "../utils/Files";

import {BuildComponent} from "./BuildComponent";
import Layout from "./common/Layout";
import {Redirect} from "react-router";

export default class Builds extends Component {
	constructor(props){
		super(props);
		this.onSetBuildPath = this.setBuildPath.bind(this);
		this.onUnsetBuildPath = this.unsetBuildPath.bind(this);
		this.authentication = SmashLadderAuthentication.create({loginCode:this.props.loginCode});
	}

	unsetBuildPath(build, event){
		event.preventDefault();
		this.props.setBuildPath(build, null);
	}

	setBuildPath(build){
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
		if(!this.authentication || !this.authentication._getAccessCode())
		{
			return <Redirect to={'/'} />
		}
		return (
			<Layout
				logout={this.props.logout}

				setReplayPath={this.props.setReplayPath}
				authentication={this.authentication}
				replayPath={this.props.replayPath}

				launchBuild={this.props.launchBuild}
				hostBuild={this.props.hostBuild}
				joinBuild={this.props.joinBuild}
				startGame={this.props.startGame}
				closeDolphin={this.props.closeDolphin}
				builds={this.props.builds}
			>
				<div className='builds collection'>
					{builds.length > 0 &&
						<div className=''>
							{builds.map((build)=>
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
