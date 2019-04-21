import _ from 'lodash';
import {
	FETCH_BUILDS_SUCCESS,
	FETCH_BUILDS_BEGIN,
	FETCH_BUILDS_FAIL,
	CLOSE_BUILD,
	LAUNCH_BUILD_BEGIN,
	LAUNCH_BUILD_FAIL,
	LAUNCH_BUILD_SUCCESS,
	UPDATED_BUILD,
	HOST_BUILD_BEGIN,
	JOIN_BUILD_BEGIN,
	HOST_BUILD_SUCCESS,
	JOIN_BUILD_SUCCESS,
	HOST_BUILD_FAIL,
	JOIN_BUILD_FAIL,
	BUILD_CLOSED,
	START_GAME_FAIL,
	AUTOHOTKEY_EVENT,
	MERGE_SETTINGS_INTO_BUILD_FAIL,
	CLOSE_BUILD_BEGIN,
	COPY_BUILD_SETTINGS_SUCCESS,
	COPY_BUILD_SETTINGS_FAIL,
	SET_BUILD_PATH_BEGIN,
	SET_BUILD_PATH_SUCCESS, SET_BUILD_PATH_FAIL
} from '../actions/builds';

const initialState = {
	builds: {},
	buildList: [],
	activeBuild: null,
	buildOpen: false,
	buildOpening: false,
	buildError: null,
	fetchingBuilds: false,
	buildSettingPath: null
};

export default (state = initialState, action) => {
	switch (action.type) {
		case MERGE_SETTINGS_INTO_BUILD_FAIL:
			return {
				...state
			};
		case FETCH_BUILDS_BEGIN:
			return {
				...state,
				fetchingBuilds: true
			};
		case FETCH_BUILDS_SUCCESS: {
			console.log('what is payload', action.payload);
			const buildList = _.values(action.payload.builds).sort((a, b) => {
				if (a.path && !b.path) {
					return -1;
				}
				if (b.path && !a.path) {
					return 1;
				}
				if (a.hasDownload() && !b.hasDownload()) {
					return -1;
				}
				if (b.hasDownload() && !a.hasDownload()) {
					return 1;
				}
				return 0;
			});
			return {
				...state,
				...action.payload,
				fetchingBuilds: false,
				buildList
			};
		}
		case FETCH_BUILDS_FAIL:
		case UPDATED_BUILD:
		case COPY_BUILD_SETTINGS_SUCCESS:
			return {
				...state,
				...action.payload,
				fetchingBuilds: false
			};
		case LAUNCH_BUILD_BEGIN:
		case HOST_BUILD_BEGIN:
		case JOIN_BUILD_BEGIN:
			return {
				...state,
				activeBuild: action.payload.build,
				buildOpen: true,
				buildOpening: true,
				buildError: null
			};
		case LAUNCH_BUILD_SUCCESS:
		case HOST_BUILD_SUCCESS:
		case JOIN_BUILD_SUCCESS:
			return {
				...state,
				activeBuild: action.payload.build,
				buildOpen: true,
				buildOpening: false,
				hostCode: action.payload ? action.payload.hostCode : null
			};
		case LAUNCH_BUILD_FAIL:
		case HOST_BUILD_FAIL:
		case JOIN_BUILD_FAIL:
		case COPY_BUILD_SETTINGS_FAIL:
			return {
				...state,
				buildOpen: false,
				buildOpening: false,
				buildError: action.payload.buildError
			};
		case BUILD_CLOSED:
		case CLOSE_BUILD_BEGIN:
			return {
				...state,
				activeBuild: null,
				buildOpen: false,
				buildOpening: false
			};
		case START_GAME_FAIL:
			return {
				...state,
				buildError: action.payload.buildError
			};
		case AUTOHOTKEY_EVENT:
			return {
				...state,
				...action.payload
			};
		case SET_BUILD_PATH_BEGIN:
			return {
				...state,
				buildSettingPath: action.payload
			};
		case SET_BUILD_PATH_SUCCESS:
		case SET_BUILD_PATH_FAIL:
			return {
				...state,
				buildSettingPath: null
			};
		default:
			return state;
	}
};
