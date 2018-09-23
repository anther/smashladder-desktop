import {SmashLadderAuthentication, endpoints} from "../utils/SmashLadderAuthentication";
import electronSettings from 'electron-settings';
import {Build} from "../utils/BuildData";

export const BUILDS_RETRIEVE = 'BUILDS_RETRIEVE';
export const BUILDS_ACQUIRED = 'BUILDS_ACQUIRED';
export const BUILDS_RETRIEVE_FAILED = 'BUILDS_RETRIEVE_FAILED';

export const SET_BUILD_PATH = 'SET_BUILD_PATH';

export const HOST_BUILD = 'HOST_BUILD';
export const JOIN_BUILD = 'JOIN_BUILD';

export const retrieveBuilds = (authentication: SmashLadderAuthentication) => {
	return (dispatch) => {
		dispatch({
			type: BUILDS_RETRIEVE,
		});
		authentication.apiGet(endpoints.DOLPHIN_BUILDS)
			.then(builds => {
				console.log(builds.builds);
				dispatch({
					type: BUILDS_ACQUIRED,
					payload: {
						builds: builds.builds
					}
				})
			}).catch(response => {
				console.log('something went wrong', response);
				dispatch({
					type: BUILDS_RETRIEVE_FAILED
				})
		});
	}
};

const saveBuild = (build: Build) => {
	const builds = electronSettings.get('builds') || {};
	if(!builds[build.dolphin_build_id]){
		builds[build.dolphin_build_id] = {};
	}
	builds[build.dolphin_build_id] = build.serialize();
	electronSettings.set('builds', builds);
};

export const setBuildPath = (build: Build, path) => {
	build.path = path;
	saveBuild(build);
	return {
		type: SET_BUILD_PATH,
		payload: {
			build
		}
	}
};

export const joinBuild = (build, hostCode) => {

};

export const hostBuild = (build, hostCode) => {

};