import React, { Component } from "react";
import { shell } from 'electron';
import Button from "./elements/Button";

export default class ReplayComponent extends Component {
	constructor(props){
		super(props);
		this.onReplayViewClick = this.replayViewClick.bind(this);
		this.onOpenInExplorer = this.openInExplorer.bind(this);
		this.onUploadReplayClick = this.uploadReplay.bind(this);
		this.onDeleteButtonClick = this.deleteButtonClick.bind(this);
		this.onCancelDeleteClick = this.cancelDeleteClick.bind(this);
		this.onDeleteConfirmClick = this.deleteConfirmClick.bind(this);

		this.state = {
			deleteQuestion: false,
			deleting: false,
		};
	}

	deleteConfirmClick(){
		this.setState({
			deleting: true
		});
		this.props.deleteReplay(this.props.replay.filePath);
	}

	deleteButtonClick(){
		this.setState({
			deleteQuestion: true
		});
	}

	cancelDeleteClick(){
		this.setState({
			deleteQuestion: false
		});
	}

	uploadReplay(){
		const { replay } = this.props;
		replay.ignoreNewnessRestriction = true;
		this.props.checkReplay(this.props.replay.id, 'manual');
	}

	openInExplorer(){
		shell.showItemInFolder(this.props.replay.filePath);
	}

	replayViewClick(){
		const { launchReplay, replay, slippiBuild } = this.props;

		launchReplay({
			replay: replay,
		});
	}

	getReplayDisplayString(){
		const { replay, launchedReplay, launchingReplay } = this.props;
		if(replay.id === launchingReplay)
		{
			return 'Launching...'
		}
		if(replay.id === launchedReplay)
		{
			return 'Restart?';
		}
		
			return 'Launch';
		
	}


	render(){
		const { replay, meleeIsoPath, settingMeleeIsoPath, launchedReplay, launchingReplay } = this.props;
		const { deleteQuestion } = this.state;
		const stage = replay.getStage();
		const characters = replay.getCharacters();
		return (
			<React.Fragment>
				<div className='main_content'>
					<div className='game_data'>
						{stage &&
							<div className='stage'>
								<img alt={stage.name} src={stage.imageUrl()} />
							</div>
						}
						<div className='characters'>
							{characters.map((character, index) => (
								<div key={`${character.name}${index}`} className='character'>
									<img alt={character.name} src={character.getStockIcon()}/>
								</div>
							))}
						</div>
						<div className='match_time'>
							{replay.getMatchTime()}
						</div>
					</div>
					<div className='file_data'>
						{replay.getFileDate() ? replay.getFileDate().calendar() : ''}
					</div>
				</div>
				<div className='secondary-content action_buttons'>
					<React.Fragment>
						{deleteQuestion &&
							<React.Fragment>
								<div className='input-field'>
									<Button
										disabled={this.state.deleting}
										onClick={this.onDeleteConfirmClick}
										className='error_button'>Delete!</Button>
								</div>
								<div className='input-field'>
									<Button
										disabled={this.state.deleting}
										onClick={this.onCancelDeleteClick}
										className=''>Never Mind!</Button>
								</div>
							</React.Fragment>
						}
						{!deleteQuestion &&
						<div className='main_buttons'>
							<div className='input-field'>
								<Button
									disabled={settingMeleeIsoPath || launchingReplay}
									onClick={this.onReplayViewClick}
									className={`btn-small ${meleeIsoPath ? 'set no_check' : 'not_set'}`}>
									{this.getReplayDisplayString()}
								</Button>
							</div>
							{false &&
							<div className='input-field'>
								<Button onClick={this.onUploadReplayClick}>
									Upload Replay
								</Button>
							</div>
							}
							{(!replay.isReadable()) &&
							<div className='input-field'>
								<Button
									onClick={this.onDeleteButtonClick}
									className='button-small error_button'>
									Delete Replay
								</Button>
							</div>
							}
							<div className='file_name_holder'>
								<a onClick={this.onOpenInExplorer} className='file_name'>
									{replay.getFileName()}
								</a>
							</div>
						</div>
						}
					</React.Fragment>
				</div>
			</React.Fragment>
		);
	}
}

class StocksDisplay extends Component
{

	render(){
		const character = this.props.character;
		return (
			<div className='player'>
			</div>
		)
	}
}