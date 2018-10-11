import CacheableDataObject from '../utils/CacheableDataObject';
import {
	DELETE_REPLAY_BEGIN,
	DELETE_REPLAY_FAIL,
	DELETE_REPLAY_SUCCESS,
	REPLAY_BROWSE_FAIL,
	REPLAY_BROWSE_START, REPLAY_BROWSE_UPDATE_DISPLAYED_REPLAYS_BEGIN, REPLAY_BROWSE_UPDATE_DISPLAYED_REPLAYS_FAIL,
	REPLAY_BROWSE_UPDATE_DISPLAYED_REPLAYS_SUCCESS, REPLAY_BROWSE_UPDATE_DISPLAYED_REPLAYS_UPDATE,
	REPLAY_BROWSE_UPDATE_SUCCESS,
	REPLAY_BROWSER_CHANGE_PAGE_NUMBER,
	VIEW_REPLAY_DETAILS_BEGIN, VIEW_REPLAY_DETAILS_END
} from '../actions/replayBrowse';

const initialState = {
	activeBrowseReplays: [],
	replayPageNumber: 1,
	allReplays: new Set(),
	replaysPerPage: 4,
	replayBrowseWatchProcess: null,
	replayWatchBuilds: null,
	viewingReplayDetails: null,
	updatingReplayList: false,
	updatingReplayListPercent: 0,
	replayListHasChanged: false
};
CacheableDataObject.clearCache();

export default (state = initialState, action) => {
	switch (action.type) {
		case VIEW_REPLAY_DETAILS_BEGIN:
			return {
				...state,
				viewingReplayDetails: action.payload
			};
		case VIEW_REPLAY_DETAILS_END:
			return {
				...state,
				viewingReplayDetails: null
			};
		case DELETE_REPLAY_BEGIN:
			return {
				...state,
				deletingReplay: action.payload,
				replayListHasChanged: true
			};
		case DELETE_REPLAY_SUCCESS:
			return {
				...state,
				deletingReplay: null
			};
		case DELETE_REPLAY_FAIL:
			return {
				...state,
				deletingReplay: null
			};
		case REPLAY_BROWSE_FAIL:
			return {
				...state,
				replayBrowseWatchProcess: null,
				replayWatchBuilds: null
			};
		case REPLAY_BROWSE_START:
			return {
				...state,
				replayBrowseWatchProcess: action.payload.replayBrowseWatchProcess,
				replayWatchBuilds: action.payload.replayWatchBuilds
			};
		case REPLAY_BROWSE_UPDATE_SUCCESS:
			return {
				...state,
				allReplays: action.payload.allReplays,
				replayListHasChanged: true
			};
		case REPLAY_BROWSE_UPDATE_DISPLAYED_REPLAYS_UPDATE:
			return {
				...state,
				updatingReplayListPercent: Math.ceil((action.payload.processed / state.allReplays.size) * 100),
				updatingReplayList: true
			};
		case REPLAY_BROWSE_UPDATE_DISPLAYED_REPLAYS_BEGIN:
			return {
				...state,
				updatingReplayListPercent: 0,
				updatingReplayList: true
			};
		case REPLAY_BROWSE_UPDATE_DISPLAYED_REPLAYS_FAIL:
			return {
				...state,
				updatingReplayList: false,
				updatingReplayListPercent: 0
			};
		case REPLAY_BROWSE_UPDATE_DISPLAYED_REPLAYS_SUCCESS:
			return {
				...state,
				activeBrowseReplays: action.payload.activeBrowseReplays,
				updatingReplayList: false,
				updatingReplayListPercent: 0,
				replayListHasChanged: false
			};
		case REPLAY_BROWSER_CHANGE_PAGE_NUMBER:
			return {
				...state,
				replayPageNumber: action.payload
			};
		default:
			return state;
	}
}