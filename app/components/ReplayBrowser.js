import React, { Component } from 'react';
import Pagination from 'react-js-pagination';
import _ from 'lodash';
import Build from "../utils/BuildData";
import Files from "../utils/Files";
import Button from "./elements/Button";
import Replay from "../utils/Replay";


export default class ReplayBrowser extends Component {

	constructor(props){
		super(props);

		this.state = {
			replays: [],
			slippiBuild: null,
			slippiPath: null,
			replayPageNumber: 1,
			totalReplays: 0,
		};

		this.onPageChange = this.handlePageChange.bind(this);
		Replay.clearCache();
	}

	static getDerivedStateFromProps(props, state){
		const paths = Build.getSlippiBuilds(props.builds);
		const replaysPerPage = 10;
		let replays = new Set();
		let aSlippiPath = null;
		let aSlippiBuild = null;
		_.each(paths, (build) => {
			const slippiPath = build.getSlippiPath();
			const files = Files.findInDirectory(slippiPath, '.slp');
			files.forEach((file) => {
				if(file.endsWith('CurrentGame.slp'))
				{
					return;
				}
				const replay = Replay.retrieve({ id: file });
				replays.add(replay);
			});
			aSlippiPath = slippiPath;
			aSlippiBuild = build;
		});
		replays = Array.from(replays).sort((a, b) => {
			return a.getFileDate() > b.getFileDate() ? -1 : 1;
		});
		const totalReplays = replays.length;

		replays = replays.slice((state.replayPageNumber - 1) * replaysPerPage, (state.replayPageNumber) * 10);

		if(!_.isEqual(replays, state.replays))
		{
			return {
				slippiPath: aSlippiPath,
				slippiBuild: aSlippiBuild,
				replays: replays,
				totalReplays: totalReplays,
			};
		}
		return null;
	}

	handlePageChange(pageNumber){
		this.setState({
			replayPageNumber: pageNumber
		});
	}

	render(){
		const { replays, slippiPath, slippiBuild, replayPageNumber, totalReplays } = this.state;
		const { launchReplay, launchReplayError, builds, meleeIsoPath, settingMeleeIsoPath, launchedReplay, launchingReplay } = this.props;

		return (
			<div className='replay_browser'>
				{replays.length > 0 &&
				<React.Fragment>
					<h4>Latest Replays</h4>
					{launchReplayError &&
					<div className='error'>
						{launchReplayError}
					</div>
					}
					<ul className='pagination'>
						<Pagination
							activePage={replayPageNumber}
							itemsCountPerPage={10}
							totalItemsCount={totalReplays}
							pageRangeDisplayed={5}
							onChange={this.onPageChange}
						/>
					</ul>
					<ul className='collection'>
						{replays.map((replay) => (
							<li key={replay.id} className='collection-item replay'>
								<ReplayComponent
								                 builds={builds}
								                 slippiPath={slippiPath}
								                 slippiBuild={slippiBuild}
								                 meleeIsoPath={meleeIsoPath}
								                 launchedReplay={launchedReplay}
								                 settingMeleeIsoPath={settingMeleeIsoPath}
								                 launchReplay={launchReplay}
								                 launchingReplay={launchingReplay}
								                 replay={replay}>
									{replay}
								</ReplayComponent>
							</li>
						))}
					</ul>

				</React.Fragment>
				}
			</div>
		)
	}
}

class ReplayComponent extends Component {
	constructor(props){
		super(props);
		this.onReplayViewClick = this.replayViewClick.bind(this);
	}

	replayViewClick(){
		const { meleeIsoPath, launchReplay, replay, slippiBuild } = this.props;

		this.props.launchReplay({
			build: slippiBuild,
			replayPath: replay.filePath,
			meleeIsoPath: meleeIsoPath,
		});
	}

	getReplayDisplayString(){
		const { replay, meleeIsoPath, launchedReplay, launchingReplay } = this.props;
		if(!meleeIsoPath)
		{
			return 'Set Melee Iso Path';
		}
		if(replay.id === launchingReplay)
		{
			return 'Launching...'
		}
		else if(replay.id === launchedReplay)
		{
			return 'Launched?';
		}
		else
		{
			return 'Launch';
		}
	}

	render(){
		const { replay, meleeIsoPath, settingMeleeIsoPath, launchedReplay, launchingReplay } = this.props;
		return (
			<React.Fragment>
				<div>
					{replay.getFileDate() ? replay.getFileDate().calendar() : ''} {replay.getName()}
				</div>
				<div className='secondary-content'>
					<Button

						disabled={settingMeleeIsoPath || launchingReplay}
						onClick={this.onReplayViewClick}
						className={`btn-small ${meleeIsoPath ? 'set no_check' : 'not_set'}`}>
						{this.getReplayDisplayString()}
					</Button>
				</div>
			</React.Fragment>
		);
	}
}