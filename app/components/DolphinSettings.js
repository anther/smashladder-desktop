/* eslint-disable jsx-a11y/label-has-for */
import React, { Component } from 'react';
import { shell } from 'electron';
import PropTypes from 'prop-types';
import _ from 'lodash';
import Button from './elements/Button';
import ProgressIndeterminate from './elements/ProgressIndeterminate';

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
		settingDolphinInstallPath: PropTypes.bool.isRequired,
		setDolphinInstallPath: PropTypes.func.isRequired,
		unsetDolphinInstallPath: PropTypes.func.isRequired,
		unsetMeleeIsoPath: PropTypes.func.isRequired,
		dolphinInstallPath: PropTypes.string
	};

	static defaultProps = {
		searchRomSubdirectories: null,
		meleeIsoPath: null,
		dolphinInstallPath: null
	};

	constructor(props) {
		super(props);
		this.onUpdateSearchSubdirectories = this.updateSearchSubdirectoriesChange.bind(this);
		this.onUpdateAllowDolphinAnalytics = this.updateAllowDolphinAnalytics.bind(this);
		this.onSetMeleeIsoPathClick = this.setMeleeIsoPathClick.bind(this);

		this.onSelectRomPathClick = this.selectRomPathClick.bind(this);
		this.onUnsetRomPathClick = this.unsetRomPathClick.bind(this);

		this.unsetDolphinInstallPath = this.unsetDolphinInstallPath.bind(this);

		this.dolphinInstallPathNavigate = this.dolphinInstallPathNavigate.bind(this);
		this.meleeIsoPathNavigate = this.meleeIsoPathNavigate.bind(this);

		this.state = {
			settingMeleeIsoPath: false
		};
	}

	meleeIsoPathNavigate() {
		const { meleeIsoPath } = this.props;
		if (!meleeIsoPath) {
			return;
		}
		shell.showItemInFolder(meleeIsoPath);
	}

	dolphinInstallPathNavigate() {
		const { dolphinInstallPath } = this.props;
		shell.showItemInFolder(dolphinInstallPath);
	}

	unsetDolphinInstallPath() {
		const { unsetDolphinInstallPath } = this.props;
		unsetDolphinInstallPath();
	}

	setMeleeIsoPathClick() {
		this.props.requestMeleeIsoPath();
	}

	unsetRomPathClick() {
		this.props.unsetMeleeIsoPath();
	}

	selectRomPathClick() {
		this.props.beginSelectingNewRomPath();
	}

	updateSearchSubdirectoriesChange(event) {
		this.props.updateSearchRomSubdirectories(event.target.checked);
	}

	updateAllowDolphinAnalytics(event) {
		this.props.updateAllowDolphinAnalytics(event.target.checked);
	}

	getRomPathsButtonText() {
		return 'Add Rom Path';
	}

	render() {
		const {
			romPaths,
			settingMeleeIsoPath,
			meleeIsoPath,
			selectingRomPath,
			beginSelectingNewRomPath,
			setDolphinInstallPath,
			settingDolphinInstallPath,
			dolphinInstallPath
		} = this.props;

		return (
			<div className="file_paths">
				<h6>Roms</h6>
				<div className="input-field">
					<Button
						className={`btn-small ${_.size(romPaths) > 0 ? 'set' : 'not_set'}`}
						disabled={selectingRomPath}
						onClick={this.onSelectRomPathClick}
					>
						{selectingRomPath && <ProgressIndeterminate/>}
						{this.getRomPathsButtonText()}
					</Button>
					<div className="rom_paths">
						{_.map(romPaths, (romPath) => (
							<div key={romPath} className="rom_path">
								<div className="options">
									<Button onClick={this.props.removeRomPath.bind(this, romPath)}
									        className="btn-small">
										X
									</Button>
								</div>
								<span className="path">{romPath}</span>
							</div>
						))}
					</div>
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
				<h6>Replays</h6>
				<div className="input-field joined_inputs set_melee_iso_path">
					<Button
						className={`btn-small ${meleeIsoPath ? 'set' : 'not_set no_check'}`}
						disabled={settingMeleeIsoPath}
						onClick={this.onSetMeleeIsoPathClick}
					>
						{settingMeleeIsoPath && <ProgressIndeterminate/>}
						Set Melee ISO Path
					</Button>
					<Button
						disabled={settingMeleeIsoPath}
						className="btn-small not_set remove_path"
						onClick={this.onUnsetRomPathClick}
					/>
					{meleeIsoPath && (
						<a onClick={this.meleeIsoPathNavigate} className="iso_path_display">
							<span className="iso_path">
								<i className="fa fa-compact-disc"/>
								<span className="text">{meleeIsoPath}</span>
							</span>
						</a>
					)}
				</div>
				<h6>Set Optional Dolphin Install Path</h6>
				<div className="input-field joined_inputs set_melee_iso_path">
					<Button
						className={`btn-small no_check ${_.size(romPaths) > 0 ? 'set' : 'not_set'}`}
						disabled={settingDolphinInstallPath}
						onClick={setDolphinInstallPath}
					>
						{settingDolphinInstallPath && <ProgressIndeterminate/>}
						Update Path
					</Button>
					<Button
						disabled={settingDolphinInstallPath}
						className="btn-small not_set remove_path"
						onClick={this.unsetDolphinInstallPath}
					/>
					<a onClick={this.dolphinInstallPathNavigate} className='iso_path_display'>
						<span className='iso_path'>
							<span className='text'>
								{!!dolphinInstallPath && dolphinInstallPath}
								{!dolphinInstallPath && 'Default Location'}
							</span>
						</span>
					</a>
				</div>
			</div>
		);
	}
}
