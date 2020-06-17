import React, { Component } from 'react';
import Pagination from 'react-js-pagination';
import ReplayComponent from './ReplayComponent';
import ProgressDeterminate from './elements/ProgressDeterminate';
import ReplayChecksToggle from './elements/ReplayChecksToggle';
import Button from './elements/Button';

export default class ReplayBrowser extends Component {
	constructor(props) {
		super(props);

		this.onPageChange = this.handlePageChange.bind(this);
		this.endError = this.endError.bind(this);
		this.state = {
			hasError: false
		};

	}

	componentDidCatch(error, info) {
		this.setState({
			hasError: true
		});
	}

	endError() {
		this.setState({
			hasError: false
		});
	}

	handlePageChange(pageNumber) {
		this.props.changeReplayPageNumber(pageNumber);
	}

	render() {
		const {
			activeBrowseReplays,
			replayPageNumber,
			allReplays,
			replaysPerPage,
			launchReplayError,
			viewingReplayDetails,
			updatingReplayList,
			updatingReplayListPercent,
			settingMeleeIsoPath,
			meleeIsoPath,
			replayWatchEnabled
		} = this.props;
		const { hasError } = this.state;

		if (hasError) {
			return (
				<div className="collection">
					<div className='collection-item'>
						<h6>
							Something has gone wrong with the replay browser!
						</h6>
						<div>
							<Button
								onClick={this.endError}
							>
								Reload?
							</Button>
						</div>
					</div>
				</div>
			);
		}

		if (viewingReplayDetails) {
			return (
				<div className="replay_browser detailed">
					<ReplayComponent {...this.props} detailed replay={viewingReplayDetails}/>
				</div>
			);
		}

		return (
			<div className={`replay_browser ${updatingReplayList ? 'replay_list_updating' : ''}`}>
				{activeBrowseReplays.length > 0 && (
					<React.Fragment>
						<h5>Latest Replays</h5>
						{false && <ReplayChecksToggle {...this.props} />}
						{launchReplayError && <div className="error">{launchReplayError}</div>}
						<div className="pagination_holder">
							<Pagination
								activePage={replayPageNumber}
								itemsCountPerPage={replaysPerPage}
								totalItemsCount={allReplays.size}
								pageRangeDisplayed={5}
								onChange={this.onPageChange}
								hideFirstLastPages
							/>
						</div>

						<div className="collection">
							{updatingReplayList && (
								<div className="replay_list_updating_progress">
									<ProgressDeterminate percent={updatingReplayListPercent}/>
								</div>
							)}
							{activeBrowseReplays.map((replay, index) => (
								<div key={replay.id} className="collection-item replay">
									<ReplayComponent
										showMeleeIsoWarning={index===0}
										{...this.props} replay={replay}/>
								</div>
							))}
						</div>
					</React.Fragment>
				)}
				{activeBrowseReplays.length === 0 &&
				updatingReplayList && (
					<React.Fragment>
						<h5>Loading Replays</h5>
						<div className="replay_list_updating_progress">
							<ProgressDeterminate percent={updatingReplayListPercent}/>
						</div>
					</React.Fragment>
				)}
			</div>
		);
	}
}
