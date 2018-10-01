import React, { Component } from 'react';
import Pagination from 'react-js-pagination';
import ReplayComponent from "./ReplayComponent";


export default class ReplayBrowser extends Component {

	constructor(props){
		super(props);
		this.onPageChange = this.handlePageChange.bind(this);
	}

	handlePageChange(pageNumber){
		this.props.changeReplayPageNumber(pageNumber);
	}

	render(){
		const {
			activeBrowseReplays,
			replayPageNumber,
			allReplays,
			replaysPerPage,
			launchReplay,
			launchReplayError,
			builds,
			meleeIsoPath,
			settingMeleeIsoPath,
			launchedReplay,
			launchingReplay,
			checkReplay,
			deleteReplay
		} = this.props;

		// console.log('REPLAYS', activeBrowseReplays);
		// console.log(totalReplays);

		return (
			<div className='replay_browser'>
				{allReplays.size > 0 &&
				<React.Fragment>
					<h4>Latest Replays</h4>
					{launchReplayError &&
					<div className='error'>
						{launchReplayError}
					</div>
					}
					<ul className='pagination'>
						<Pagination
							activePage={replayPageNumber}
							itemsCountPerPage={replaysPerPage}
							totalItemsCount={allReplays.size}
							pageRangeDisplayed={10}
							onChange={this.onPageChange}
						/>
					</ul>
					<ul className='collection'>
						{activeBrowseReplays.map((replay) => (
							<li key={replay.id} className='collection-item replay'>
								<ReplayComponent
									deleteReplay={deleteReplay}
									checkReplay={checkReplay}
									builds={builds}
									meleeIsoPath={meleeIsoPath}
									launchedReplay={launchedReplay}
									settingMeleeIsoPath={settingMeleeIsoPath}
									launchReplay={launchReplay}
									launchingReplay={launchingReplay}
									replay={replay}>
									{replay}
								</ReplayComponent>
							</li>
						))}
					</ul>

				</React.Fragment>
				}
			</div>
		)
	}
}