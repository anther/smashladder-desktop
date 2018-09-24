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


export class BuildComponent extends Component {
	props: {
		buildLauncher: BuildLaunchAhk,
		build: Build,
	}

	constructor(props){
		super(props);
		this.setBuildPath = this.props.setBuildPath;
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
		};

		this.onHostClick = this.hostClick.bind(this);
		this.onCloseClick = this.closeClick.bind(this);
		this.onJoinClick = this.joinClick.bind(this);
		this.onJoinCodeChange = this.joinCodeChange.bind(this);
		this.onJoinKeyPress = this.joinKeyPress.bind(this);
		this.onJoinCodeSubmit = this.joinCodeSubmit.bind(this);
		this.onDownloadClick = this.downloadClick.bind(this);

		this.onSelectedGameChange = this.selectedGameChange.bind(this);
	}

	downloadClick(){
		this.setState({
			downloading: 'download',
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
							downloading: 'unzipping'
						});
						switch(extension.toLowerCase())
						{
							case '.zip':
								let ri = 0;
								var unzipper = require("unzipper");

								console.log('Before open zip', zipWriteLocation);
								multitry(500, 5, ()=>{
									fs.createReadStream(zipWriteLocation)
										.pipe(unzipper.Extract({ path: unzipLocation })
											.on('close', ()=>{
												this.setState({
													downloading: null
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

	joinCodeSubmit(event){
		this.setState({
			submittingJoinCode: true
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
		this.buildLauncher.close().then(() => {
			this._dolphinClosed();
			this.setState({
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
				this.setState({
					hosting: null,
					error: String(error),
					dolphinOpen: false
				});
			});
	}

	render(){
		const {build} = this.props;
		return (
			<div className='build' key={build.id}>
				<div onClick={this.setBuildPath.bind(null, build)} className='build_heading'>
					<div className='path_button'>
						{build.path &&
							<span className='has_path'>
								<Button className='btn-small'>Path Set <i className="fa fa-check" /></Button>
							</span>
						}
						{!build.path &&
							<span className='no_path'>
								<Button className='btn-small'>Path Not Set <i className="fa fa-times" /></Button>
							</span>
						}
					</div>

					<span className='build_name'>
						{build.name}
					</span>
					{!build.path &&
						<span className='badge red-text'>Click to set path</span>
					}

				</div>
				<div className='build_actions'>

					<Button onClick={this.onHostClick}>Host</Button>
					<Button onClick={this.onCloseClick}>Close</Button>
					<Button onClick={this.onJoinClick}>Join</Button>
					{build.hasDownload() &&
					<Button onClick={this.onDownloadClick}>
						Download <i className='fa fa-cloud-download-alt' />
					</Button>
					}
				</div>

				{this.state.enterJoinCode &&
				<div>
					<input type='text' value={this.state.joinCode} onChange={this.onJoinCodeChange}
					       onKeyPress={this.onJoinKeyPress}/>
					<button onClick={this.onJoinCodeSubmit}>Submit Join Code</button>
				</div>
				}

				<select onChange={this.onSelectedGameChange} value={this.state.selectedGame}>
					{build.getPossibleGames().map((game) =>
						<option value={game.id} key={game.id}>
							{game.name}
						</option>
					)}
				</select>
				<div>
					{this.state.dolphinOpen &&
					<div>Dolphin Is Open!</div>
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