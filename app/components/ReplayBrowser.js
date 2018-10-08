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
			launchReplayError,
			viewingReplayDetails
		} = this.props;

		if(viewingReplayDetails)
		{
			return (
				<div className='replay_browser'>
					<ReplayComponent
						{...this.props}
						detailed
						replay={viewingReplayDetails}
					/>
				</div>
			)
		}

		return (
			<div className='replay_browser'>
				{allReplays.size > 0 &&
				<React.Fragment>
					<h5>Latest Replays</h5>
					{launchReplayError &&
					<div className='error'>
						{launchReplayError}
					</div>
					}
					<div className='pagination_holder'>
						<Pagination
							activePage={replayPageNumber}
							itemsCountPerPage={replaysPerPage}
							totalItemsCount={allReplays.size}
							pageRangeDisplayed={5}
							onChange={this.onPageChange}
							hideFirstLastPages
						/>
					</div>
					<ul className='collection'>
						{activeBrowseReplays.map((replay) => (
							<li key={replay.id} className='collection-item replay'>
								<ReplayComponent
									{...this.props}
									replay={replay}
								/>
							</li>
						))}
					</ul>

				</React.Fragment>
				}
			</div>
		)
	}
}