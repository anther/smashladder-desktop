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


export class BuildComponent extends Component {
	props: {
		buildLauncher: BuildLaunchAhk,
		build: Build,
		setBuildPath: func,
		onSetBuildPathClick: func,
		unsetBuildPath: func,
	}

	constructor(props){
		super(props);
		this.onSetBuildPathClick = this.props.onSetBuildPathClick;
		this.unsetBuildPath = this.props.unsetBuildPath;
		this.buildLauncher = this.props.buildLauncher;

		const {build} = this.props;
		const selectedGame = build.getPossibleGames()[0];

		this.state = {
			error: null,
			selectedGame: selectedGame.id,
			hosting: false,
			dolphinOpen: false,
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

		const basePath = Files.createApplicationPath('./dolphin');

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
							downloading: 'Unzipping File',
							downloadingProgress: null,
						});
						switch(extension.toLowerCase())
						{
							case '.zip':
								var unzipper = require("unzipper");

								console.log('Before open zip', zipWriteLocation);
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
											.on('entry', (entry) => {
												this.setState({
													unzipStatus: entry.path ? entry.path : null
												});
											})
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

	joinCodeCancel(event){
		this.setState({
			enterJoinCode: false,
			joinCode: ''
		});
	}

	joinCodeSubmit(event){
		this.setState({
			submittingJoinCode: true,
			enterJoinCode: false
		});
		this.buildLauncher.join(this.props.build, this.state.joinCode)
			.then((dolphinProcess) => {
				this.setState({
					submittingJoinCode: false
				});

			})
			.catch((error) => {
				this.setState({
					submittingJoinCode: false,
					error: String(error),
					dolphinOpen: false
				});
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
		return this.buildLauncher.close().then(() => {
			this._dolphinClosed();
			this.setState({
				error: null,
				hosting: null,
			})
		});
	}

	_dolphinClosed(){
		const {authentication} = this.props;
		this.setState({
			dolphinOpen: false,
			hosting: null,
		});
		authentication.apiPost(endpoints.CLOSED_DOLPHIN);
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

	launchClick(){
		this.buildLauncher.launch(this.props.build)
			.then(() => {
				this.setState({
					dolphinOpen: true
				});
			}).catch((error) => {
				this.setState({
					dolphinOpen: false,
					error: String(error)
				});
			})
	}

	hostClick(){
		const {authentication} = this.props;

		this.setState({error: null});
		const game = this._getSelectedGame();
		this.setState({
			dolphinOpen: true
		});
		this.buildLauncher.host(this.props.build, game)
			.then(([dolphinProcess, hostCode]) => {
				authentication.apiPost(endpoints.OPENED_DOLPHIN);
				dolphinProcess.on('close', (e) => {
					this._dolphinClosed();
				});

				authentication.apiPost(endpoints.DOLPHIN_HOST, {host_code: hostCode});
				this.setState({
					hosting: hostCode,
				})
			})
			.catch((error) => {
				console.log('the error', error);
				this.closeClick().then(() => {
					const newState = {
						hosting: null,
					};
					if(error.dolphinAction)
					{
						newState.error = error.value;
					}
					else
					{
						newState.error = String(error);
					}
					this.setState(newState);
				});
			});
	}

	render(){
		const {build} = this.props;
		return (
			<div className='build' key={build.id}>
				<div className='build_heading'>
					<div className='path_button'>
						{build.path &&
						<span className='has_path'>
								<Button
									onClick={this.onSetBuildPathClick.bind(null, build)}
									onContextMenu={this.unsetBuildPath.bind(null, build)}
									className='btn-small'>Path Set <i className="fa fa-check"/></Button>
							</span>

						}
						{!build.path &&
							<span className='no_path'>
								<Button
									onClick={this.onSetBuildPathClick.bind(null, build)}
									className='btn-small'>Path Not Set <i className="fa fa-times"/></Button>
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
							{!this.state.dolphinOpen &&
								<React.Fragment>
									<Button onClick={this.onLaunchClick}>Launch</Button>
									<Button onClick={this.onHostClick}>Host</Button>
									<Button onClick={this.onJoinClick}>Join</Button>
								</React.Fragment>
							}
							{this.state.dolphinOpen &&
								<Button onClick={this.onCloseClick}>Close</Button>
							}
						</div>
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
					</React.Fragment>
					}
					{!build.path && build.hasDownload() &&
					<React.Fragment>
						{!this.state.downloading &&
						<Button className='download_build' onClick={this.onDownloadClick}>
							Download <i className='fa fa-cloud-download-alt'/>
						</Button>
						}
						{this.state.downloading &&
						<React.Fragment>
									<span className='downloading_status'>
										<div>{this.state.downloading}</div>
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
					<img class='join_logo' src={this._getSelectedGame().small_image}/>

				</div>
				}

				<div>
					{this.state.dolphinOpen &&
						<ProgressDeterminate />
					}
					{this.state.hosting &&
					<div className='error'>{this.state.hosting}</div>
					}
					{this.state.error &&
					<div className='error'>Error! {this.state.error}</div>
					}
				</div>
			</div>
		)
	}
}