/* eslint-disable jsx-a11y/label-has-for */
import React, { Component } from 'react';
import { shell } from 'electron';
import PropTypes from 'prop-types';
import _ from 'lodash';
import Button from './elements/Button';
import ProgressIndeterminate from './elements/ProgressIndeterminate';
import defaultDolphinInstallPath from '../constants/defaultDolphinInstallPath';

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
		this.onUpdateAllowDolphinAnalytics = this.onUpdateAllowDolphinAnalytics.bind(this);
		this.onSetMeleeIsoPathClick = this.setMeleeIsoPathClick.bind(this);

		this.onSelectRomPathClick = this.selectRomPathClick.bind(this);
		this.onUnsetRomPathClick = this.unsetRomPathClick.bind(this);

		this.unsetDolphinInstallPath = this.unsetDolphinInstallPath.bind(this);

		this.dolphinInstallPathNavigate = this.dolphinInstallPathNavigate.bind(this);
		this.meleeIsoPathNavigate = this.meleeIsoPathNavigate.bind(this);

		this.state = {
			currentSubPage: null
		};
	}

	onUpdateAllowDolphinAnalytics() {
		this.props.updateAllowDolphinAnalytics(!this.props.allowDolphinAnalytics);
	}

	meleeIsoPathNavigate() {
		const { meleeIsoPath } = this.props;
		if (!meleeIsoPath) {
			return;
		}
		shell.showItemInFolder(meleeIsoPath);
	}

	dolphinInstallPathNavigate(e) {
		const { dolphinInstallPath } = this.props;
		e.stopPropagation();
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
			dolphinInstallPath,
			verifyingMeleeIso,
			meleeIsoVerified,
			meleeIsoPathError
		} = this.props;

		const usingDefaultInstallPath = dolphinInstallPath === defaultDolphinInstallPath;

		return (
			<div className="file_paths collection">
				<div
					className={`collection-item ${!meleeIsoPath ? 'waves-effect' : ''}`}
					onClick={meleeIsoPath ? undefined : this.onSetMeleeIsoPathClick}
				>
					<h6>Melee ISO Path</h6>
					<div className='sub-content'>
						{!meleeIsoPath &&
						<div className='sub-content'>
							<span className='error'>
							Not Set, needed to Launch Replays
							</span>
						</div>
						}
						{meleeIsoPath && (
							<a onClick={this.meleeIsoPathNavigate} className="iso_path_display">
								<span className="iso_path">
									<span className="text">{meleeIsoPath}</span>
								</span>
							</a>
						)}
						{!verifyingMeleeIso &&
						<div>
							{meleeIsoPath && meleeIsoVerified &&
							<div className='success-text'>1.02 ISO correctly configured</div>}
							{meleeIsoPath && !meleeIsoVerified && <div className='error'>Is Not 1.02</div>}
						</div>
						}
						{verifyingMeleeIso &&
						<div>
							<i className='fa fa-spin fa-cog'/>
							{' '}Verifying Melee Iso...
						</div>

						}
						{meleeIsoPath &&
						<Button
							className={`${meleeIsoPath ? 'set no_check' : 'not_set no_check'}`}
							small
							disabled={settingMeleeIsoPath}
							onClick={this.onSetMeleeIsoPathClick}
						>
							{settingMeleeIsoPath && <ProgressIndeterminate
								windowFocused={this.props.windowFocused}
							/>}
							Set Melee ISO Path
						</Button>
						}
						{meleeIsoPath &&
						<div className='secondary-content'>
							<Button
								small
								disabled={settingMeleeIsoPath}
								className="not_set remove_path no_check"
								onClick={this.onUnsetRomPathClick}
							>
								Remove
							</Button>
						</div>
						}
					</div>
				</div>
				<div className='collection-item'>
					<h6>Rom Paths</h6>
					<label>
						{_.size(romPaths)} Path{_.size(romPaths) !== 1 && 's'} Set
					</label>
					{_.map(romPaths, (romPath) => (
						<div key={romPath}>
							<div className="options">
								<div className='clickable'>{romPath}</div>
								<Button
									small
									onClick={this.props.removeRomPath.bind(this, romPath)}
									className="not_set">
									Remove
								</Button>
							</div>
						</div>
					))}
					<div className='input-field'>
						<Button
							small
							disabled={selectingRomPath}
							onClick={this.onSelectRomPathClick}
							loading={selectingRomPath}
							className="btn-small set no_check">
							{selectingRomPath && <ProgressIndeterminate
								windowFocused={this.props.windowFocused}
							/>}
							Add
						</Button>
					</div>

				</div>

				<div className={`collection-item ${usingDefaultInstallPath ? 'waves-effect' : ''}`}
				     onClick={usingDefaultInstallPath ? setDolphinInstallPath : undefined}
				>
					<h6>Dolphin Install Path</h6>

					<span onClick={this.dolphinInstallPathNavigate} className='sub-content iso_path_display clickable'>
						<span className='iso_path'>
							<span className='text'>
								{!usingDefaultInstallPath && dolphinInstallPath}
								{usingDefaultInstallPath && 'Default Location'}
							</span>
						</span>
					</span>

					<div>
						{!usingDefaultInstallPath &&
						<Button
							small
							className={`no_check ${_.size(romPaths) > 0 ? 'set' : 'not_set'}`}
							disabled={settingDolphinInstallPath}
							onClick={setDolphinInstallPath}
						>
							{settingDolphinInstallPath && <ProgressIndeterminate
								windowFocused={this.props.windowFocused}
							/>}
							Update Path
						</Button>
						}
						{!usingDefaultInstallPath &&
						<div className='secondary-content'>
							<Button
								disabled={settingDolphinInstallPath}
								small
								className="not_set remove_path no_check"
								onClick={this.unsetDolphinInstallPath}
							>
								Use Default
							</Button>
						</div>
						}
					</div>
				</div>
				<div className='collection-item waves-effect'
				     onClick={this.onUpdateAllowDolphinAnalytics}
				>
					<h6>Dolphin Team Analytics</h6>
					<label>
						<input
							type="checkbox"
							checked={this.props.allowDolphinAnalytics}
						/>
						<span>Send Dolphin Analytics</span>
					</label>
				</div>

			</div>
		);
	}
}
