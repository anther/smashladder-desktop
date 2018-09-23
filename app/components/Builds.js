import React, {Component} from 'react';

import {SmashLadderAuthentication} from "../utils/SmashLadderAuthentication";
import {BuildData} from "../utils/BuildData";
import {Files} from "../utils/Files";
import {BuildLaunchAhk} from "../utils/BuildLaunchAhk";
import {ReplaySync} from "../components/ReplaySync";

import {BuildComponent} from "./BuildComponent";

export default class Builds extends Component {
	constructor(props){
		super(props);
		this.onSetBuildPath = this.setBuildPath.bind(this);
		this.buildLauncher = new BuildLaunchAhk();
		this.authentication = SmashLadderAuthentication.create(this.props.loginCode);
	}

	setBuildPath(build){
		Files.selectFile()
			.then((path)=>{
				if(path)
				{
					this.props.setBuildPath(build, path);
				}
			})
	}

	componentWillMount(){
		this.props.retrieveBuilds(this.authentication);
	}

	render(){
		const { builds } = this.props;
		const buildData = BuildData.create({builds});
		return (
			<div className='builds'>
				<h1>Builds</h1>
				<ReplaySync
					replayPath={this.props.replayPath}
					setReplayPath={this.props.setReplayPath}
				/>
				{buildData.hasBuilds() &&
					buildData.getBuilds().map((build)=>
						<BuildComponent 
							key={build.dolphin_build_id}
							authentication={this.authentication}
							build={build}
							setBuildPath={this.onSetBuildPath}
							buildLauncher={this.buildLauncher}
							
						/>
					)
				}
			</div>
		);
	}
}
