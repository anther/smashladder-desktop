/* eslint-disable no-restricted-syntax */
import electronSettings from 'electron-settings';
import _ from 'lodash';
import fs from 'fs';
import { endpoints } from '../utils/SmashLadderAuthentication';
import Build from '../utils/BuildData';
import BuildLaunchAhk from '../utils/BuildLaunchAhk';
import getAuthenticationFromState from '../utils/getAuthenticationFromState';
import DolphinConfigurationUpdater from '../utils/DolphinConfigurationUpdater';

import {
	addRomPath,
	beginSelectingNewRomPath,
	updateAllowDolphinAnalytics,
	updateSearchRomSubdirectories
} from './dolphinSettings';
import { startReplayBrowser } from './replayBrowse';
import { parseDolphinPlayerList } from './dolphinStatus';

export const FETCH_BUILDS_BEGIN = 'FETCH_BUILDS_BEGIN';
export const FETCH_BUILDS_SUCCESS = 'FETCH_BUILDS_SUCCESS';
export const FETCH_BUILDS_FAIL = 'FETCH_BUILDS_FAIL';

export const COPY_BUILD_SETTINGS_BEGIN = 'COPY_BUILD_SETTINGS_BEGIN';
export const COPY_BUILD_SETTINGS_SUCCESS = 'COPY_BUILD_SETTINGS_SUCCESS';
export const COPY_BUILD_SETTINGS_FAIL = 'COPY_BUILD_SETTINGS_FAIL';

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
export const CLOSE_BUILD_BEGIN = 'CLOSE_BUILD_BEGIN';
export const CLOSE_BUILD_SUCCESS = 'CLOSE_BUILD_SUCCESS';
export const CLOSE_BUILD_FAIL = 'CLOSE_BUILD_FAIL';
export const CLOSE_BUILD_SEND_BEGIN = 'CLOSE_BUILD_SEND_BEGIN';
export const CLOSE_BUILD_SEND_SUCCESS = 'CLOSE_BUILD_SEND_SUCCESS';
export const CLOSE_BUILD_SEND_FAIL = 'CLOSE_BUILD_SEND_FAIL';

export const START_GAME_BEGIN = 'START_GAME_BEGIN';
export const START_GAME_SUCCESS = 'START_GAME_SUCCESS';
export const START_GAME_FAIL = 'START_GAME_FAIL';

export const MERGE_SETTINGS_INTO_BUILD_BEGIN =
	'MERGE_SETTINGS_INTO_BUILD_BEGIN';
export const MERGE_SETTINGS_INTO_BUILD_SUCCESS =
	'MERGE_SETTINGS_INTO_BUILD_SUCCESS';
export const MERGE_SETTINGS_INTO_BUILD_FAIL = 'MERGE_SETTINGS_INTO_BUILD_FAIL';

export const SYNC_BUILDS_BEGIN = 'SYNC_BUILDS_BEGIN';
export const SYNC_BUILDS_SUCCESS = 'SYNC_BUILDS_SUCCESS';
export const SYNC_BUILDS_FAIL = 'SYNC_BUILDS_FAIL';

export const AUTOHOTKEY_EVENT = 'AUTOHOTKEY_ACTION';
export const UPDATE_BUILD_TO_FULLSCREEN_BEGIN = 'UPDATE_BUILD_TO_FULLSCREEN_BEGIN';
export const UPDATE_BUILD_TO_FULLSCREEN_SUCCESS = 'UPDATE_BUILD_TO_FULLSCREEN_SUCCESS';
export const UPDATE_BUILD_TO_FULLSCREEN_FAIL = 'UPDATE_BUILD_TO_FULLSCREEN_FAIL';

let buildLauncher = null;
export const initializeBuildLauncher = () => dispatch => {
	buildLauncher = new BuildLaunchAhk();
	buildLauncher.on('ahkEvent', event => {
		if (event.action === 'player_list_info') {
			dispatch(parseDolphinPlayerList(event.value));
		}
	});
};

export const retrieveBuilds = () => (dispatch, getState) => {
	dispatch({
		type: FETCH_BUILDS_BEGIN
	});
	const savedBuildData = electronSettings.get('builds', {});
	getAuthenticationFromState(getState)
		.apiGet(endpoints.DOLPHIN_BUILDS)
		.then(response => {
			let builds = convertLadderBuildListToSomethingThatMakesSense(
				response.builds
			);
			builds = combineWithSavedBuildData(builds, savedBuildData);

			electronSettings.set('builds', builds);

			dispatch({
				type: FETCH_BUILDS_SUCCESS,
				payload: {
					builds
				}
			});
			dispatch(startReplayBrowser());
			return response;
		})
		.catch(() => {
			const builds = combineWithSavedBuildData(savedBuildData, savedBuildData);
			dispatch({
				type: FETCH_BUILDS_FAIL,
				payload: {
					builds
				}
			});
			dispatch(startReplayBrowser());
		});
};

const convertLadderBuildListToSomethingThatMakesSense = ladderList => {
	const buildList = {};
	_.forEach(ladderList, buildData => {
		for (let build of buildData.builds) {
			build = buildList[build.dolphin_build_id] || Build.create(build);
			buildList[build.dolphin_build_id] = build;
			build.addLadder(buildData.ladder);
		}
	});
	return buildList;
};

const combineWithSavedBuildData = (rawBuildData, savedBuildData) => {
	const buildList = {};
	_.forEach(rawBuildData, build => {
		if (savedBuildData[build.dolphin_build_id]) {
			build = Object.assign(savedBuildData[build.dolphin_build_id], build);
		}
		build = buildList[build.dolphin_build_id] || Build.create(build);
		buildList[build.dolphin_build_id] = build;
		if (!fs.existsSync(build.executablePath())) {
			build.pathError = true;
		}
	});
	return buildList;
};

const saveBuild = (build: Build) => (dispatch, getState) => {
	const state = getState();
	const builds = electronSettings.get('builds') || {};
	if (!builds[build.dolphin_build_id]) {
		builds[build.dolphin_build_id] = {};
	}
	builds[build.dolphin_build_id] = build.serialize();
	electronSettings.set('builds', builds);

	const currentBuilds = { ...state.builds.builds };
	currentBuilds[build.dolphin_build_id] = build;
	dispatch({
		type: UPDATED_BUILD,
		payload: {
			builds: currentBuilds
		}
	});

	dispatch(copyBuildSettings(build));
};

const copyBuildSettings = (build: Build) => (dispatch, getState) => {
	const state = getState();
	const currentBuilds = { ...state.builds.builds };
	if (build.executablePath()) {
		const addRom = path => {
			dispatch(addRomPath(path));
		};
		const allowAnalytics = set => {
			dispatch(updateAllowDolphinAnalytics(set));
		};
		const updateSearchRomSetting = set => {
			dispatch(updateSearchRomSubdirectories(set));
		};
		dispatch({
			type: COPY_BUILD_SETTINGS_BEGIN
		});
		DolphinConfigurationUpdater.copyInitialSettingsFromBuild(
			build.executablePath(),
			addRom,
			allowAnalytics,
			updateSearchRomSetting
		)
			.then(() => {
				dispatch({
					type: COPY_BUILD_SETTINGS_SUCCESS,
					payload: {
						builds: currentBuilds
					}
				});
				dispatch(startReplayBrowser());
			})
			.catch(error => {
				dispatch(buildFailError(COPY_BUILD_SETTINGS_FAIL, build, error));
			});
	}
};

export const setDefaultPreferableNewUserBuildOptions = (build) => (dispatch) => {
	dispatch({
		type: UPDATE_BUILD_TO_FULLSCREEN_BEGIN
	});
	DolphinConfigurationUpdater.setToFullScreen(build)
		.then(() => {
			dispatch({
				type: UPDATE_BUILD_TO_FULLSCREEN_SUCCESS
			});
		})
		.catch((error) => {
			dispatch({
				type: UPDATE_BUILD_TO_FULLSCREEN_FAIL
			});
			console.log(error);
		});
};

export const setBuildPath = (build: Build, path) => (dispatch, getState) => {
	build.path = path;
	dispatch(saveBuild(build, getState));
	if (build.executablePath()) {
		dispatch(mergeInitialSettingsIntoBuild(build));
	}
	dispatch(syncBuildsWithServer());
};

const syncBuildsWithServer = () => (dispatch, getState) => {
	const authentication = getAuthenticationFromState(getState);
	const { builds } = getState().builds;

	const buildIds = {};
	_.each(builds, build => {
		if (!build.executablePath()) {
			return;
		}
		buildIds[build.dolphin_build_id] = build.dolphin_build_id;
	});

	dispatch({
		type: SYNC_BUILDS_BEGIN
	});
	authentication
		.apiPost(endpoints.SET_ACTIVE_BUILDS, { build_ids: buildIds })
		.then(() => {
			dispatch({
				type: SYNC_BUILDS_SUCCESS
			});
		})
		.catch(error => {
			console.error(error);
			dispatch({
				type: SYNC_BUILDS_FAIL
			});
		});
};

const mergeInitialSettingsIntoBuild = build => (dispatch, getState) => {
	const state = getState();
	dispatch(copyBuildSettings(build));
	dispatch({
		type: MERGE_SETTINGS_INTO_BUILD_BEGIN
	});
	if (!build) {
		const errorMessage = 'Programmer Error: No Build Provided...';
		dispatch({
			type: MERGE_SETTINGS_INTO_BUILD_FAIL,
			payload: errorMessage
		});
		throw new Error(errorMessage);
	}
	DolphinConfigurationUpdater.updateInitialSettings(build, {
		...state.dolphinSettings
	})
		.then(() => {
			dispatch({
				type: MERGE_SETTINGS_INTO_BUILD_SUCCESS,
				payload: build
			});
			return true;
		})
		.catch(error => {
			dispatch({
				type: MERGE_SETTINGS_INTO_BUILD_FAIL,
				payload: {
					build: build,
					error: error.toString ? error.toString() : error
				}
			});
			console.error(error);
		});
};

export const startGame = () => dispatch => {
	dispatch({
		type: START_GAME_BEGIN
	});
	buildLauncher
		.startGame()
		.then(() => {
			dispatch({
				type: START_GAME_SUCCESS
			});
		})
		.catch(() => {
			dispatch({
				type: START_GAME_FAIL
			});
		});
};

export const authotkeyAction = event => dispatch => {
	dispatch({
		type: AUTOHOTKEY_EVENT,
		payload: {
			event: event
		}
	});
};

export const closeDolphin = () => (dispatch, getState) => {
	const authentication = getAuthenticationFromState(getState);
	dispatch({
		type: CLOSE_BUILD_BEGIN
	});
	buildLauncher
		.close()
		.then(() => {
			dispatch({
				type: CLOSE_BUILD_SUCCESS
			});
			dispatch({
				type: CLOSE_BUILD_SEND_BEGIN
			});
			authentication
				.apiPost(endpoints.CLOSED_DOLPHIN)
				.then(() => {
					dispatch({
						type: CLOSE_BUILD_SEND_SUCCESS
					});
				})
				.catch(() => {
					dispatch({
						type: CLOSE_BUILD_SEND_FAIL
					});
				});
			dispatch(startReplayBrowser());
		})
		.catch(error => {
			console.error(error);
			dispatch({
				type: CLOSE_BUILD_FAIL
			});
		});
};

export const launchBuild = build => dispatch => {
	dispatch({
		type: LAUNCH_BUILD_BEGIN,
		payload: {
			build
		}
	});
	dispatch(mergeInitialSettingsIntoBuild(build));
	buildLauncher
		.launch(build)
		.then(({ dolphinProcess }) => {
			dispatch({
				type: LAUNCH_BUILD_SUCCESS,
				payload: {
					build
				}
			});
			return dolphinProcess.stopsRunning.then(() => {
				dispatch({
					type: BUILD_CLOSED
				});
			});
		})
		.catch(error => {
			dispatch(buildFailError(LAUNCH_BUILD_FAIL, build, error));
		});
};

export const joinBuild = (build, hostCode) => (dispatch, getState) => {
	const state = getState();
	dispatch({
		type: JOIN_BUILD_BEGIN,
		payload: {
			build,
			hostCode
		}
	});
	dispatch(mergeInitialSettingsIntoBuild(build));
	try {
		build.setSlippiToRecord();
	} catch (error) {
		dispatch(buildFailError(HOST_BUILD_FAIL, build, error));
		return;
	}
	DolphinConfigurationUpdater.mergeSettingsIntoDolphinIni(
		build.executablePath(),
		{
			NetPlay: {
				NickName: state.login.player.username,
				HostCode: hostCode,
				TraversalChoice: 'traversal'
			}
		}
	)
		.then(() => buildLauncher.join(build, hostCode))
		.then(() => {
			dispatch({
				type: JOIN_BUILD_SUCCESS,
				payload: {
					build
				}
			});
		})
		.catch(error => {
			dispatch(buildFailError(JOIN_BUILD_FAIL, build, error));
			dispatch(closeDolphin());
		});
};

export const hostBuild = (build, game) => async (dispatch, getState) => {
	const authentication = getAuthenticationFromState(getState);
	const state = getState();
	dispatch({
		type: HOST_BUILD_BEGIN,
		payload: {
			build,
			game
		}
	});
	try {
		dispatch(mergeInitialSettingsIntoBuild(build));
		build.setSlippiToRecord();
	} catch (error) {
		dispatch(buildFailError(HOST_BUILD_FAIL, build, error));
		return;
	}
	DolphinConfigurationUpdater.mergeSettingsIntoDolphinIni(
		build.executablePath(),
		{
			NetPlay: {
				NickName: state.login.player.username,
				TraversalChoice: 'traversal'
			}
		}
	)
		.then(() => buildLauncher.host(build, game))
		.then(({ dolphinProcess, result }) => {
			authentication.apiPost(endpoints.OPENED_DOLPHIN);
			console.log(dolphinProcess, result);
			authentication.apiPost(endpoints.DOLPHIN_HOST, {
				host_code: result.value
			});
			dispatch({
				type: HOST_BUILD_SUCCESS,
				payload: {
					build,
					hostCode: result.value
				}
			});
			return dolphinProcess.stopsRunning.then(() => {
				dispatch({
					type: BUILD_CLOSED
				});
			});
		})
		.catch(error => {
			if (error && error.action === 'setup_netplay_host_failed') {
				dispatch(
					beginSelectingNewRomPath(
						`Select your ${game.name} ROM!`,
						hostBuild.apply(this, [build, game])
					)
				);
			}
			console.log('the error', error);
			dispatch(closeDolphin());
			dispatch(buildFailError(HOST_BUILD_FAIL, build, error));
		});
};

const buildFailError = (type, build, error) => {
	console.error(error);
	if (error && error.value) {
		error = error.value;
	}
	if (error.toString) {
		error = error.toString();
	}
	console.log('why not show', error);
	return {
		type: type,
		payload: {
			buildError: {
				for: build.id,
				error: String(error)
			}
		}
	};
};
