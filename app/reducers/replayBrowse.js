import CacheableDataObject from "../utils/CacheableDataObject";
import {
    DELETE_REPLAY_BEGIN,
    DELETE_REPLAY_FAIL,
    DELETE_REPLAY_SUCCESS,
    REPLAY_BROWSE_FAIL,
    REPLAY_BROWSE_START,
    REPLAY_BROWSE_UPDATE_DISPLAYED_REPLAYS,
    REPLAY_BROWSE_UPDATE_SUCCESS,
    REPLAY_BROWSER_CHANGE_PAGE_NUMBER,
    VIEW_REPLAY_DETAILS_BEGIN, VIEW_REPLAY_DETAILS_END
} from "../actions/replayBrowse";

const initialState = {
	activeBrowseReplays: [],
	replayPageNumber: 1,
	allReplays: new Set(),
	replaysPerPage: 4,
	replayBrowseWatchProcess: null,
	replayWatchBuilds: null,
	viewingReplayDetails: null,
};
CacheableDataObject.clearCache();

export default (state = initialState, action) => {
	switch(action.type)
	{
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
				deletingReplay: action.payload
			};
		case DELETE_REPLAY_SUCCESS:
			return {
				...state,
				deletingReplay: null,
			};
		case DELETE_REPLAY_FAIL:
			return {
				...state,
				deletingReplay: null,
			};
		case REPLAY_BROWSE_FAIL:
			return {
				...state,
				replayBrowseWatchProcess: null,
				replayWatchBuilds: null,
			};
		case REPLAY_BROWSE_START:
			return {
				...state,
				replayBrowseWatchProcess: action.payload.replayBrowseWatchProcess,
				replayWatchBuilds: action.payload.replayWatchBuilds,
			};
		case REPLAY_BROWSE_UPDATE_SUCCESS:
			return {
				...state,
				allReplays: action.payload.allReplays,
			};
		case REPLAY_BROWSE_UPDATE_DISPLAYED_REPLAYS:
			return {
				...state,
				activeBrowseReplays: action.payload.activeBrowseReplays,
			};
		case REPLAY_BROWSER_CHANGE_PAGE_NUMBER:
			return {
				...state,
				replayPageNumber: action.payload,
			};
		default:
			return state;
	}
}