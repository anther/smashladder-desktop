import React, { Component } from 'react';
import Pagination from 'react-js-pagination';
import _ from 'lodash';
import { shell } from 'electron';
import Build from "../utils/BuildData";
import Files from "../utils/Files";
import Button from "./elements/Button";
import Replay from "../utils/Replay";
import Constants from "../utils/Constants";


export default class ReplayBrowser extends Component {

	constructor(props){
		super(props);

		this.state = {
			replays: [],
			slippiBuild: null,
			slippiPath: null,
			replayPageNumber: 1,
			totalReplays: 0,
			replaysPerPage: 7,
		};

		this.onPageChange = this.handlePageChange.bind(this);
		Replay.clearCache();
	}

	static getDerivedStateFromProps(props, state){
		const paths = Build.getSlippiBuilds(props.builds);
		const replaysPerPage = state.replaysPerPage;
		let replays = new Set();
		let aSlippiPath = null;
		let aSlippiBuild = null;
		_.each(paths, (build) => {
			const slippiPath = build.getSlippiPath();
			const files = Files.findInDirectory(slippiPath, '.slp');
			files.forEach((file) => {
				if(file.endsWith(Constants.SLIPPI_REPLAY_FILE_NAME))
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

		replays = replays.slice((state.replayPageNumber - 1) * replaysPerPage, (state.replayPageNumber) * replaysPerPage);

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
		const { replays, slippiPath, slippiBuild, replayPageNumber, totalReplays, replaysPerPage } = this.state;
		const { launchReplay, launchReplayError, builds, meleeIsoPath, settingMeleeIsoPath, launchedReplay, launchingReplay } = this.props;

		return (
			<div className='replay_browser'>
				{totalReplays > 0 &&
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
							itemsCountPerPage={replaysPerPage}
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
		this.onOpenInExplorer = this.openInExplorer.bind(this);
	}

	openInExplorer(){
		shell.showItemInFolder(this.props.replay.filePath);
	}

	replayViewClick(){
		const { launchReplay, replay, slippiBuild } = this.props;

		launchReplay({
			build: slippiBuild,
			replayPath: replay.filePath,
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
			return 'Restart?';
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
				<div className='main_content'>
					<div className='game_data'>
						<div className='match_time'>
							{replay.getMatchTime()}
						</div>
						<div className='characters'>
							{replay.getCharacters().map( (character, index) => (
								<div key={`${character.name}${index}`} className='character'>
									<img alt={character.name} src={character.getStockIcon()} />
								</div>
							))}
						</div>
					</div>
					<div className='file_data'>
						{replay.getFileDate() ? replay.getFileDate().calendar() : ''}
					</div>
					<a onClick={this.onOpenInExplorer} className='file_name'>
						{replay.getFileName()}
					</a>
				</div>
				<div className='secondary-content action_buttons'>
					<Button

						disabled={settingMeleeIsoPath || launchingReplay}
						onClick={this.onReplayViewClick}
						className={`btn-small ${meleeIsoPath ? 'set no_check' : 'not_set'}`}>
						{this.getReplayDisplayString()}
					</Button>
					{false && replay.id === launchedReplay &&
						<Button className='error_button'>
							Delete Replay
						</Button>
					}
				</div>
			</React.Fragment>
		);
	}
}