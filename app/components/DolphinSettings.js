/* eslint-disable jsx-a11y/label-has-for */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import Button from './elements/Button';
import Files from '../utils/Files';

export default class DolphinSettings extends Component {
	static propTypes = {
		searchRomSubdirectories: PropTypes.bool,
		addRomPath: PropTypes.func.isRequired,
		removeRomPath: PropTypes.func.isRequired,
		romPaths: PropTypes.objectOf(PropTypes.string).isRequired,
		selectingRomPath: PropTypes.bool.isRequired,
		allowDolphinAnalytics: PropTypes.bool.isRequired,
		beginSelectingNewRomPath: PropTypes.func.isRequired,
		updateSearchRomSubdirectories: PropTypes.func.isRequired,
		updateAllowDolphinAnalytics: PropTypes.func.isRequired,
		settingMeleeIsoPath: PropTypes.bool.isRequired,
		requestMeleeIsoPath: PropTypes.func.isRequired,
		meleeIsoPath: PropTypes.string,
	};

	static defaultProps = {
		searchRomSubdirectories: null,
		meleeIsoPath: null,
	};

	constructor(props){
		super(props);
		this.onClickUpdateMeleeIsoPath = this.clickUpdateMeleeIsoPath.bind(this);
		this.onUpdateSearchSubdirectories = this.updateSearchSubdirectoriesChange.bind(this);
		this.onUpdateAllowDolphinAnalytics = this.updateAllowDolphinAnalytics.bind(this);

		this.state = {
			settingMeleeIsoPath: false,
		};
	}

	updateSearchSubdirectoriesChange(event){
		this.props.updateSearchRomSubdirectories(event.target.checked);
	}

	updateAllowDolphinAnalytics(event){
		this.props.updateAllowDolphinAnalytics(event.target.checked);
	}

	clickUpdateMeleeIsoPath(){
		this.props.requestMeleeIsoPath();
	}

	getRomPathsButtonText(){
		return 'Add Rom Path';
	}

	render(){
		const { romPaths, settingMeleeIsoPath, meleeIsoPath, selectingRomPath, beginSelectingNewRomPath } = this.props;

		return (
			<div className="file_paths">
				<h5>Dolphin Settings</h5>
				<h6>Roms</h6>
				<div className="input-field">
					<Button
	                    className={`btn-small ${meleeIsoPath ? 'set' : 'not_set'}`}
						disabled={settingMeleeIsoPath}
						onClick={this.onClickUpdateMeleeIsoPath}
					>
						Set Melee ISO Path
					</Button>
				</div>
				<div className="input-field">
					<Button
						className={`btn-small ${romPaths.length > 0 ? 'set' : 'not_set'}`}
						disabled={selectingRomPath}
						onClick={beginSelectingNewRomPath}
					>
						{this.getRomPathsButtonText()}
					</Button>
					<div className="rom_paths">
						{_.map(romPaths, romPath => (
							<div key={romPath} className="rom_path">
								<div className="options">
									<Button
										onClick={this.props.removeRomPath.bind(this, romPath)}
										className="btn-small"
									>
										X
									</Button>
								</div>
								<span className="path">{romPath}</span>
							</div>
						))}
					</div>
				</div>
				<div className="search_subdirectories">
					<label>
						<input
							type="checkbox"
							onChange={this.onUpdateSearchSubdirectories}
							checked={this.props.searchRomSubdirectories}
						/>
						<span>Search Subdirectories</span>
					</label>
				</div>
				<h6>Dolphin Team Analytics</h6>
				<label>
					<input
						type="checkbox"
						onChange={this.onUpdateAllowDolphinAnalytics}
						checked={this.props.allowDolphinAnalytics}
					/>
					<span>Send Dolphin Analytics</span>
				</label>
			</div>
		);
	}
}
