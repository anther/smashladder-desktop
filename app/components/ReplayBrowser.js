import React, { Component } from 'react';
import Pagination from 'react-js-pagination';
import ReplayComponent from './ReplayComponent';
import ProgressDeterminate from './elements/ProgressDeterminate';
import ReplayChecksToggle from './elements/ReplayChecksToggle';

export default class ReplayBrowser extends Component {
	constructor(props) {
		super(props);
		this.onPageChange = this.handlePageChange.bind(this);
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

		if (viewingReplayDetails) {
			return (
				<div className="replay_browser detailed">
					<ReplayComponent {...this.props} detailed replay={viewingReplayDetails} />
				</div>
			);
		}

		return (
			<div className={`replay_browser ${updatingReplayList ? 'replay_list_updating' : ''}`}>
				{activeBrowseReplays.length > 0 && (
					<React.Fragment>
						<h5>Latest Replays</h5>
						<ReplayChecksToggle {...this.props} />
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
									<ProgressDeterminate percent={updatingReplayListPercent} />
								</div>
							)}
							{activeBrowseReplays.map((replay) => (
								<div key={replay.id} className="collection-item replay">
									<ReplayComponent {...this.props} replay={replay} />
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
								<ProgressDeterminate percent={updatingReplayListPercent} />
							</div>
						</React.Fragment>
					)}
			</div>
		);
	}
}
