import React, {Component} from 'react';
import {Files} from "../utils/Files";
import ReplaySyncer from "../utils/ReplaySyncer";

export class ReplaySync extends Component
{
	constructor(props){
		super(props);
		this.onSetReplayDirectoryPath = this.setReplayDirectoryPath.bind(this);
		this.syncer = ReplaySyncer.retrieve()
			.setReplayPath(this.props.replayPath)
			.setAuthentication(this.props.authentication)
	}

	setReplayDirectoryPath(){
		Files.selectDirectory().then((path)=>{
			if(path)
			{
				this.props.setReplayPath(path);
			}
		})
	}

	render(){
		return(
			<div>
				{this.props.replayPath &&
				<React.Fragment>

					<div className=''>Watching {this.props.replayPath}</div>
					<div className='sync_status'>
						{this.syncer.getSyncStatusStatement()}
					</div>
				</React.Fragment>
				}
				{!this.props.replayPath &&
					<button onClick={this.onSetReplayDirectoryPath}>Set Replay Path</button>
				}
			</div>
		);
	}
}