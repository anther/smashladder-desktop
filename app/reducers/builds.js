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
	AUTOHOTKEY_EVENT, COPIED_BUILD_SETTINGS
} from '../actions/builds';

const initialState = {
  builds: {},
  activeBuild: null,
  buildOpen: false,
  buildOpening: false,
  buildError: null,
  fetchingBuilds: false
};

export default (state = initialState, action) => {
  switch (action.type) {
    case FETCH_BUILDS_BEGIN:
      return {
        ...state,
        fetchingBuilds: true
      };
    case FETCH_BUILDS_SUCCESS:
    case FETCH_BUILDS_FAIL:
    case UPDATED_BUILD:
    case COPIED_BUILD_SETTINGS:
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
      return {
        ...state,
        buildOpen: false,
        buildOpening: false,
        buildError: action.payload.buildError
      };
    case BUILD_CLOSED:
    case CLOSE_BUILD:
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
    default:
      return state;
  }
};
