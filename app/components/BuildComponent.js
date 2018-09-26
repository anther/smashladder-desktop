import React, {Component} from "react";
import {endpoints} from "../utils/SmashLadderAuthentication";
import {Build} from "../utils/BuildData";
import {BuildLaunchAhk} from "../utils/BuildLaunchAhk";
import {Files} from "../utils/Files";

const {clipboard} = require('electron')
const {app} = require('electron').remote;
import path from "path";
import multitry from "../utils/multitry";

import Button from './elements/Button';
import Select from './elements/Select';
import ProgressIndeterminate from "./elements/ProgressIndeterminate";
import ProgressDeterminate from "./elements/ProgressDeterminate";
import _ from 'lodash';


export class BuildComponent extends Component {
	props: {
		build: Build,
		setBuildPath: func,
		onSetBuildPathClick: func,
		unsetBuildPath: func,

		launchBuild: func,
		closeDolphin: func,
	};

	constructor(props){
		super(props);
		this.onSetBuildPathClick = this.props.onSetBuildPathClick;
		this.unsetBuildPath = this.props.unsetBuildPath;

		const {build} = this.props;
		const selectedGame = build.getPrimaryGame();

		this.state = {
			error: null,
			selectedGame: selectedGame ? selectedGame.id : null,
			joinCode: '',
			enterJoinCode: false,
			submittingJoinCode: false,

			downloading: null,
			downloadingProgress: null,
			downloadError: null,
		};

		this.onHostClick = this.hostClick.bind(this);
		this.onCloseClick = this.closeClick.bind(this);
		this.onJoinClick = this.joinClick.bind(this);
		this.onLaunchClick = this.launchClick.bind(this);
		this.onStartGameClick = this.startGameClick.bind(this);

		this.onJoinCodeChange = this.joinCodeChange.bind(this);
		this.onJoinKeyPress = this.joinKeyPress.bind(this);
		this.onJoinCodeSubmit = this.joinCodeSubmit.bind(this);
		this.onJoinCodeCancel = this.joinCodeCancel.bind(this);
		this.onDownloadClick = this.downloadClick.bind(this);

		this.onSelectedGameChange = this.selectedGameChange.bind(this);
	}

	downloadClick(){
		this.setState({
			downloading: 'Downloading...',
			downloadError: null,
		});
		var fs = require('fs');
		var request = require('request');
		var progress = require('request-progress');
		const {build} = this.props;

		const basePath = Files.createApplicationPath('./dolphin_downloads');

		const baseName = `${Files.makeFilenameSafe(build.name + build.id)}`;
		const extension = require('path').extname(build.download_file);
		const baseNameAndExtension = `${baseName}${extension}`;
		const unzipLocation = path.join(basePath, baseName, '/');
		const zipWriteLocation = path.join(basePath, baseNameAndExtension);

		console.log('basepath', basePath);
		console.log('unzipLocation', unzipLocation);
		console.log('zipWriteLocation', zipWriteLocation);

		Files.ensureDirectoryExists(basePath, 0o0755)
			.then(() => {
				// The options argument is optional so you can omit it
				progress(request(build.download_file), {})
					.on('progress', (state) => {

						this.setState({
							downloadingProgress: state.percent
						});
						console.log('progress', state);
					})
					.on('error', (err) => {
						this.setState({
							downloadError: err,
							downloading: null
						});
					})
					.once('finish', () => {
						console.log('finished!')
					})
					.on('end', () => {
						console.log('ended!')
						// Do something after request finishes
						this.setState({
							downloading: 'Unzipping Build',
							downloadingProgress: null,
						});
						switch(extension.toLowerCase())
						{
							case '.zip':
								var unzipper = require("unzipper");

								console.log('Before open zip', zipWriteLocation);
								const updateEntryDisplay = _.throttle((entry) => {
									this.setState({
										unzipStatus: entry.path ? entry.path : null
									});
								}, 100);
								multitry(500, 5, () => {
									fs.createReadStream(zipWriteLocation)
										.pipe(unzipper.Extract({path: unzipLocation})
											.on('close', () => {
												const found = Files.findInDirectory(unzipLocation, 'Dolphin.exe');
												if(found.length)
												{
													this.props.setBuildPath(build, found[0]);
												}
												this.setState({
													downloading: null,
													unzipStatus: null,
												});
											})
											.on('entry', updateEntryDisplay)
										);

								});

								break;
						}
					})
					.pipe(fs.createWriteStream(zipWriteLocation));
			})
			.catch((error) => {
				this.setState({
					error: error ? error.toString() : 'Error Downloading File...'
				});
			});


	}

	joinKeyPress(event){
		if(event.key === 'Enter')
		{
			event.stopPropagation();
			this.joinCodeSubmit();
		}
	}

	joinCodeCancel(){
		this.setState({
			enterJoinCode: false,
			joinCode: ''
		});
	}

	joinCodeChange(event){
		this.setState({
			joinCode: event.target.value
		});
	}

	joinClick(){
		this.setState({
			enterJoinCode: true,
			joinCode: clipboard.readText(),
		});
	}

	selectedGameChange(event){
		this.setState({
			selectedGame: event.target.value
		});
	}

	closeClick(){
		return this.props.closeDolphin();
	}

	_getSelectedGame(){
		const game = this.props.build.getPossibleGames().find((game) => {
			return game.id === this.state.selectedGame;
		});
		if(!game)
		{
			this.setState({
				error: 'Somehow No Game Is Selected'
			});
			return null;
		}
		return game;
	}

	joinCodeSubmit(){
		this.props.joinBuild(this.props.build, this.state.joinCode);
	}

	launchClick(){
		this.props.launchBuild(this.props.build);
	}

	hostClick(){
		this.props.hostBuild(this.props.build, this._getSelectedGame());
	}

	startGameClick(){
		this.props.startGame(this.props.build);
	}

	render(){
		const {build, buildOpen, buildOpening, hostCode, buildError} = this.props;
		const error = this.state.error || buildError;
		return (
			<div className='build' key={build.id}>
				<div className='build_heading'>
					<div className='path_button'>
						{build.path &&
						<span className='has_path'>
								<Button
									title={build.path}
									onClick={this.onSetBuildPathClick.bind(null, build)}
									onContextMenu={this.unsetBuildPath.bind(null, build)}
									className='btn-small'>Path Set ✔</Button>
							</span>

						}
						{!build.path &&
						<span className='no_path'>
								<Button
									onClick={this.onSetBuildPathClick.bind(null, build)}
									className='btn-small'>Path Not Set ❌</Button>
							</span>
						}
					</div>

					<span className='build_name'>
						{build.name}
					</span>
				</div>

				{!this.state.enterJoinCode &&
				<div className='build_actions'>

					{build.path &&
					<React.Fragment>
						<div className='dolphin_actions'>
							{!buildOpen &&
							<React.Fragment>
								<Button onClick={this.onLaunchClick}>Launch</Button>
								<Button onClick={this.onHostClick}>Host</Button>
								<Button onClick={this.onJoinClick}>Join</Button>
							</React.Fragment>
							}
							{buildOpen &&
							<React.Fragment>
								<Button onClick={this.onCloseClick}>Close</Button>
								{hostCode &&
								<Button onClick={this.onStartGameClick}>Start Game</Button>
								}
							</React.Fragment>
							}
						</div>
						{buildOpen && hostCode &&
						<h6 className='host_code'>{hostCode}</h6>
						}
						{!buildOpen &&
						<div className='select_game_container'>
							<Select className='select_game'
							        onChange={this.onSelectedGameChange}
							        value={this.state.selectedGame}>
								{build.getPossibleGames().map((game) =>
									<option value={game.id} key={game.id}>
										{game.name}
									</option>
								)}
							</Select>
						</div>
						}
					</React.Fragment>
					}
					{!build.path && build.hasDownload() &&
					<React.Fragment>
						{!this.state.downloading &&
						<Button className='download_build' onClick={this.onDownloadClick}>
							Download <span className='download_arrow'>⇩</span>
						</Button>
						}
						{this.state.downloading &&
						<React.Fragment>
									<span className='downloading_status'>
										<div>
											<span className='text'>{this.state.downloading}{' '}</span>
											{this.state.downloadingProgress &&
												<span className='percent'>{Math.floor(this.state.downloadingProgress * 100)}%</span>
											}
										</div>
										<div>{this.state.unzipStatus}</div>
									</span>
							{this.state.downloadingProgress &&
							<ProgressDeterminate percent={this.state.downloadingProgress * 100}/>
							}
							{!this.state.downloadingProgress &&
							<ProgressIndeterminate/>
							}
						</React.Fragment>
						}
					</React.Fragment>
					}
				</div>
				}

				{this.state.enterJoinCode &&
				<div className='enter_join_code dolphin_actions'>
					<input
						className='join_code_input'
						placeholder='Host Code Goes Here'
						type='text' value={this.state.joinCode} onChange={this.onJoinCodeChange}
						onKeyPress={this.onJoinKeyPress}/>
					<Button onClick={this.onJoinCodeSubmit}>Go!</Button>
					<Button className='cancel' onClick={this.onJoinCodeCancel}>Cancel</Button>

				</div>
				}

				<div>
					{buildOpening &&
					<ProgressIndeterminate/>
					}
					{buildOpen &&
					<ProgressDeterminate/>
					}
					{error &&
					<div className='error'>{error}</div>
					}
				</div>
			</div>
		)
	}
}