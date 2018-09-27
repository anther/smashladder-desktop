/* eslint-disable no-restricted-syntax */
import electronSettings from 'electron-settings';
import _ from "lodash";
import { endpoints } from "../utils/SmashLadderAuthentication";
import { Build } from "../utils/BuildData";
import { BuildLaunchAhk } from "../utils/BuildLaunchAhk";
import getAuthenticationFromState from '../utils/getAuthenticationFromState';

export const FETCH_BUILDS_BEGIN = 'FETCH_BUILDS_BEGIN';
export const FETCH_BUILDS_SUCCESS = 'FETCH_BUILDS_SUCCESS';
export const FETCH_BUILDS_FAIL = 'FETCH_BUILDS_FAIL';

export const UPDATED_BUILD = 'UPDATED_BUILD';

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


export const retrieveBuilds = () => (dispatch, getState) => {
	dispatch({
		type: FETCH_BUILDS_BEGIN,
	});
	const savedBuildData = electronSettings.get('builds') || {};
	getAuthenticationFromState(getState)
		.apiGet(endpoints.DOLPHIN_BUILDS)
		.then(response => {
			let builds = convertLadderBuildListToSomethingThatMakesSense(response.builds);
			builds = combineWithSavedBuildData(builds, savedBuildData);

			electronSettings.set('builds', builds);

			dispatch({
				type: FETCH_BUILDS_SUCCESS,
				payload: {
					builds
				}
			})
			return response;
		}).catch(() => {
		const builds = combineWithSavedBuildData(savedBuildData, savedBuildData);
		dispatch({
			type: FETCH_BUILDS_FAIL,
			payload: {
				builds
			}
		})
	});
};

const convertLadderBuildListToSomethingThatMakesSense = (ladderList) => {
	const buildList = {};
	_.forEach(ladderList, (buildData) => {
		for(let build of buildData.builds)
		{
			build = buildList[build.dolphin_build_id] || Build.create(build);
			buildList[build.dolphin_build_id] = build;
			build.addLadder(buildData.ladder);
		}
	});
	return buildList;
};

const combineWithSavedBuildData = (rawBuildData, savedBuildData) => {
	const buildList = {};
	_.forEach(rawBuildData, (build) => {
		let newBuild = build;
		if(savedBuildData[build.dolphin_build_id])
		{
			newBuild = Object.assign(savedBuildData[build.dolphin_build_id], build);
		}
		newBuild = buildList[build.dolphin_build_id] || Build.create(build);
		buildList[build.dolphin_build_id] = newBuild;
	});
	return buildList;
};

const saveBuild = (build: Build, getState) => {
	const state = getState();
	const builds = electronSettings.get('builds') || {};
	if(!builds[build.dolphin_build_id])
	{
		builds[build.dolphin_build_id] = {};
	}
	builds[build.dolphin_build_id] = build.serialize();
	electronSettings.set('builds', builds);

	const currentBuilds = { ...state.builds.builds };
	currentBuilds[build.dolphin_build_id] = build;
	return {
		type: UPDATED_BUILD,
		payload: {
			builds: currentBuilds
		}
	};
};

export const setBuildPath = (build: Build, path) => (dispatch, getState) => {
	build.path = path;
	dispatch(saveBuild(build, getState));
};

export const startGame = () => (dispatch) => {
	dispatch({
		type: START_GAME_BEGIN
	});
	buildLauncher.startGame().then(() => {
		dispatch({
			type: START_GAME_SUCCESS
		});
	}).catch(() => {
		dispatch({
			type: START_GAME_FAIL,
		});

	});
};

export const closeDolphin = () => (dispatch, getState) => {
	const authentication = getAuthenticationFromState(getState);
	buildLauncher.close().then(() => {
		dispatch({
			type: CLOSE_BUILD
		});
		authentication.apiPost(endpoints.CLOSED_DOLPHIN);
	}).catch((error) => {
		console.error(error);
	});
};

export const launchBuild = (build) => (dispatch) => {
	dispatch({
		type: LAUNCH_BUILD_BEGIN,
		payload: {
			build
		}
	});
	buildLauncher.launch(build)
		.then((dolphinProcess) => {
			dolphinProcess.on('close', () => {
				dispatch({
					type: BUILD_CLOSED
				})
			});
			dispatch({
				type: LAUNCH_BUILD_SUCCESS,
				payload: {
					build
				}
			});
		}).catch((error) => {
		dispatch(buildFailError(LAUNCH_BUILD_FAIL, build, error));
	})
};

export const joinBuild = (build, hostCode) => (dispatch) => {
	dispatch({
		type: JOIN_BUILD_BEGIN,
		payload: {
			build,
			hostCode,
		}
	});
	buildLauncher.join(build, hostCode)
		.then(() => {
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
	const authentication = getAuthenticationFromState(getState);
	dispatch({
		type: HOST_BUILD_BEGIN,
		payload: {
			build,
			game,
		}
	});
	buildLauncher.host(build, game)
		.then(([dolphinProcess, hostCode]) => {
			authentication.apiPost(endpoints.OPENED_DOLPHIN);
			dolphinProcess.on('close', () => {
				dispatch({
					type: BUILD_CLOSED
				})
			});

			authentication.apiPost(endpoints.DOLPHIN_HOST, { host_code: hostCode });
			dispatch({
				type: HOST_BUILD_SUCCESS,
				payload: {
					hostCode
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

};