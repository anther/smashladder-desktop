import {SmashLadderAuthentication, endpoints} from "../utils/SmashLadderAuthentication";
import electronSettings from 'electron-settings';
import {Build} from "../utils/BuildData";
import {BuildLaunchAhk} from "../utils/BuildLaunchAhk";
import _ from "lodash";

export const FETCH_BUILDS_BEGIN = 'FETCH_BUILDS_BEGIN';
export const FETCH_BUILDS_SUCCESS = 'FETCH_BUILDS_SUCCESS';
export const FETCH_BUILDS_FAIL = 'FETCH_BUILDS_FAIL';

export const SET_BUILD_PATH = 'SET_BUILD_PATH';

export const HOST_BUILD_BEGIN = 'HOST_BUILD_BEGIN';
export const HOST_BUILD_SUCCESS = 'HOST_BUILD_SUCCESS';
export const HOST_BUILD_FAIL = 'HOST_BUILD_FAIL';

export const JOIN_BUILD_BEGIN = 'JOIN_BUILD_BEGIN';
export const JOIN_BUILD_SUCCESS = 'JOIN_BUILD_SUCCESS';
export const JOIN_BUILD_FAIL = 'JOIN_BUILD_FAIL';

export const LAUNCH_BUILD_BEGIN = 'LAUNCH_BUILD_BEGIN';
export const LAUNCH_BUILD_SUCCESS = 'LAUNCH_BUILD_SUCCESS';
export const LAUNCH_BUILD_FAIL = 'LAUNCH_BUILD_FAIL';

export const BUILD_CLOSED = 'BUILD_CLOSED';
export const CLOSE_BUILD = 'CLOSE_BUILD';

export const START_GAME_BEGIN = 'START_GAME';
export const START_GAME_SUCCESS = 'START_GAME_SUCCESS';
export const START_GAME_FAIL = 'START_GAME_FAIL';

const buildLauncher = new BuildLaunchAhk();

const retrieveAuthentication = (getState) => {
	return SmashLadderAuthentication.create(getState().login.loginCode);
};

export const retrieveBuilds = () => {
	return (dispatch, getState) => {
		dispatch({
			type: FETCH_BUILDS_BEGIN,
		});
		retrieveAuthentication(getState).apiGet(endpoints.DOLPHIN_BUILDS)
			.then(response => {
				console.log('retrieved build response', response)
				const builds = organizeFetchedBuilds(response.builds);

				dispatch({
					type: FETCH_BUILDS_SUCCESS,
					payload: {
						builds: builds
					}
				})
			}).catch(response => {
				console.log('something went wrong', response);
				dispatch({
					type: FETCH_BUILDS_FAIL
				})
		});
	}
};

const organizeFetchedBuilds = (rawBuildData) =>{
	const buildList = new Map();
	const savedBuildData = electronSettings.get('builds') || {};
	_.forEach(rawBuildData, (buildData) =>{
		for(let build of buildData.builds){
			if(savedBuildData[build.dolphin_build_id])
			{
				build = Object.assign(savedBuildData[build.dolphin_build_id], build);
			}
			build = buildList.get(build.dolphin_build_id) || Build.create(build);
			buildList.set(build.dolphin_build_id, build);
			build.addLadder(buildData.ladder);
		}
	});
	return Array.from(buildList.values()).sort((a,b)=>{
		if(a.path && !b.path)
		{
			return -1;
		}
		if(b.path && !a.path)
		{
			return 1;
		}
		return 0;
	});
};

const saveBuild = (build: Build) => {
	const builds = electronSettings.get('builds') || {};
	if(!builds[build.dolphin_build_id]){
		builds[build.dolphin_build_id] = {};
	}
	builds[build.dolphin_build_id] = build.serialize();
	electronSettings.set('builds', builds);
};

const retrieveSavedBuildFromBuild = (build) => {
	const builds = electronSettings.get('builds') || {};
	if(builds[build.dolphin_build_id]){
		builds[build.dolphin_build_id] = {};
	}
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

export const startGame = () =>{
	return(dispatch) => {
		dispatch({
			type: START_GAME_BEGIN
		});
		buildLauncher.startGame().then(() => {
			dispatch({
				type: START_GAME_SUCCESS
			});
		}).catch((error)=>{
			dispatch({
				type: START_GAME_FAIL,
			});

		});
	}
};

export const closeDolphin = () =>{
	return(dispatch, getState) => {
		const authentication = retrieveAuthentication(getState);
		buildLauncher.close().then(() => {
			dispatch({
				type: CLOSE_BUILD
			});
			authentication.apiPost(endpoints.CLOSED_DOLPHIN);
		});
	}
};

export const launchBuild = (build) => {
	return (dispatch) => {
		dispatch({
			type: LAUNCH_BUILD_BEGIN,
			payload: {
				build
			}
		});
		buildLauncher.launch(build)
			.then((dolphinProcess) => {
				dolphinProcess.on('close', ()=>{
					dispatch({
						type: BUILD_CLOSED
					})
				});
				dispatch({
					type: LAUNCH_BUILD_SUCCESS,
					payload: {
						build: build
					}
				});
			}).catch((error) => {
				dispatch(buildFailError(LAUNCH_BUILD_FAIL, build, error));
			})
	};
};

export const joinBuild = (build, hostCode) => (dispatch, getState) => {
	dispatch({
		type: JOIN_BUILD_BEGIN,
		payload: {
			build,
			hostCode,
		}
	});
	buildLauncher.join(build, hostCode)
		.then((dolphinProcess) => {
			dispatch({
				type: JOIN_BUILD_SUCCESS
			})
		})
		.catch((error) => {
			dispatch(buildFailError(JOIN_BUILD_FAIL, build, error));
			dispatch(closeDolphin());
		});
};

export const hostBuild = (build, game) => (dispatch, getState) => {
	const authentication = retrieveAuthentication(getState);
	dispatch({
		type: HOST_BUILD_BEGIN,
		payload: {
			build: build,
			game: game,
		}
	});
	buildLauncher.host(build, game)
		.then(([dolphinProcess, hostCode]) => {
			authentication.apiPost(endpoints.OPENED_DOLPHIN);
			dolphinProcess.on('close', (e) => {
				dispatch({
					type: BUILD_CLOSED
				})
			});

			authentication.apiPost(endpoints.DOLPHIN_HOST, {host_code: hostCode});
			dispatch({
				type: HOST_BUILD_SUCCESS,
				payload: {
					hostCode: hostCode
				}
			});
		})
		.catch((error) => {
			dispatch(buildFailError(HOST_BUILD_FAIL, build, error));
			dispatch(closeDolphin());
		});
};

const buildFailError = (type, build, error) => {
	console.log(error);
	return {
		type: HOST_BUILD_FAIL,
		payload: {
			buildError: {
				for: build.id,
				error: String(error),
			}
		}
	}

}