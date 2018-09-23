import React, { Component } from "react";
import { endpoints } from "../utils/SmashLadderAuthentication";

export class BuildComponent extends Component{
	constructor(props){
		super(props);
		this.setBuildPath = this.props.setBuildPath;
		this.buildLauncher = this.props.buildLauncher;

		const {build} = this.props;
		const selectedGame = build.getPossibleGames()[0];

		this.state = {
			hostError: null,
			selectedGame: selectedGame.id,
		};

		this.onHostClick = this.hostClick.bind(this);
		this.onSelectedGameChange = this.selectedGameChange.bind(this);
	}

	selectedGameChange(event){
		this.setState({
			selectedGame: event.target.value
		});
	}

	hostClick(){
		this.setState({hostError: null});
		const game = this.props.build.getPossibleGames().find((game)=>{
			return game.id === this.state.selectedGame;
		});
		this.buildLauncher.host(this.props.build, game)
			.then((child)=>{
				console.log('returned', child);
				this.props.authentication.apiPost(endpoints.OPENED_DOLPHIN);

				child.on('close', (e)=>{
					this.props.authentication.apiPost(endpoints.CLOSED_DOLPHIN);
				});
			})
			.catch((error)=>{
				console.error('caught error', error);
				// this.setState({hostError: error});
			});
	}

	render(){
		const { build } = this.props;
		return(
			<div key={build.id}>
				<h4>{build.name}</h4>
				<div>
					<button onClick={this.setBuildPath.bind(null, build)}>Set Path</button>

					{build.path &&
					<span className='path'>{build.path}</span>
					}
					{!build.path &&
					<span className='path not_set'>path not set</span>
					}

				</div>
				<button onClick={this.onHostClick}>Host</button>
				{this.state.hostError &&
				<span className='error'>{this.state.hostError}</span>
				}
				<button>Join</button>
				<select onChange={this.onSelectedGameChange} value={this.state.selectedGame}>
					{build.getPossibleGames().map((game) =>
						<option value={game.id} key={game.id}>
							{game.name}
						</option>
					)}
				</select>
			</div>
		)
	}
}