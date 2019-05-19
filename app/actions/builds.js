/* eslint-disable no-restricted-syntax */
import electronSettings from 'electron-settings';
import _ from 'lodash';
import fs from 'fs';
import unzipper from 'unzipper';
import request from 'request';
import progress from 'request-progress';
import path from 'path';
import { createSelector } from 'reselect';

import Files from '../utils/Files';
import multitry from '../utils/multitry';

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
import { beginWatchingForReplayChanges } from './replayWatch';
import Constants from '../utils/Constants';

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

export const MERGE_SETTINGS_INTO_BUILD_BEGIN = 'MERGE_SETTINGS_INTO_BUILD_BEGIN';
export const MERGE_SETTINGS_INTO_BUILD_SUCCESS = 'MERGE_SETTINGS_INTO_BUILD_SUCCESS';
export const MERGE_SETTINGS_INTO_BUILD_FAIL = 'MERGE_SETTINGS_INTO_BUILD_FAIL';

export const SYNC_BUILDS_BEGIN = 'SYNC_BUILDS_BEGIN';
export const SYNC_BUILDS_SUCCESS = 'SYNC_BUILDS_SUCCESS';
export const SYNC_BUILDS_FAIL = 'SYNC_BUILDS_FAIL';

export const AUTOHOTKEY_EVENT = 'AUTOHOTKEY_ACTION';
export const UPDATE_BUILD_TO_FULLSCREEN_BEGIN = 'UPDATE_BUILD_TO_FULLSCREEN_BEGIN';
export const UPDATE_BUILD_TO_FULLSCREEN_SUCCESS = 'UPDATE_BUILD_TO_FULLSCREEN_SUCCESS';
export const UPDATE_BUILD_TO_FULLSCREEN_FAIL = 'UPDATE_BUILD_TO_FULLSCREEN_FAIL';

export const SET_BUILD_PATH_BEGIN = 'SET_BUILD_PATH_BEGIN';
export const SET_BUILD_PATH_SUCCESS = 'SET_BUILD_PATH_SUCCESS';
export const SET_BUILD_PATH_FAIL = 'SET_BUILD_PATH_FAIL';

export const DOWNLOAD_BUILD_ALREADY_ACTIVE = 'DOWNLOAD_BUILD_ALREADY_ACTIVE';
export const DOWNLOAD_BUILD_BEGIN = 'DOWNLOAD_BUILD_BEGIN';
export const DOWNLOAD_BUILD_SUCCESS = 'DOWNLOAD_BUILD_SUCCESS';
export const DOWNLOAD_BUILD_ERROR = 'DOWNLOAD_BUILD_ERROR';
export const UNZIP_BUILD_BEGIN = 'UNZIP_BUILD_BEGIN';
export const UNZIP_BUILD_SUCCESS = 'UNZIP_BUILD_SUCCESS';
export const UNZIP_BUILD_ERROR = 'UNZIP_BUILD_ERROR';
export const UNZIP_BUILD_PROGRESS_UPDATE = 'UNZIP_BUILD_PROGRESS_UPDATE';
export const BUILD_DOWNLOAD_PROGRESS_UPDATE = 'BUILD_DOWNLOAD_PROGRESS_UPDATE';
export const UPDATING_NEW_BUILDS_BEGIN = 'UPDATING_NEW_BUILDS_BEGIN';
export const UPDATING_NEW_BUILDS_SUCCESS = 'UPDATING_NEW_BUILDS_SUCCESS';
export const UPDATING_NEW_BUILDS_FAIL = 'UPDATING_NEW_BUILDS_FAIL';
export const UPDATING_NEW_BUILDS_ALREADY_IN_PROGRESS = 'UPDATING_NEW_BUILDS_ALREADY_IN_PROGRESS';


let buildLauncher = null;
export const initializeBuildLauncher = () => (dispatch) => {
	if (!buildLauncher) {
		buildLauncher = new BuildLaunchAhk();
		buildLauncher.on('ahkEvent', (event) => {
			if (event.action === 'player_list_info') {
				dispatch(parseDolphinPlayerList(event.value));
			}
		});
	}
};

export const retrieveBuildsAndInstall = () => (dispatch, getState) => {
	if (getState().builds.downloadActive) {
		dispatch({
			type: UPDATING_NEW_BUILDS_ALREADY_IN_PROGRESS
		});
		return false;
	}


	fetchBuildsMainFunction(dispatch, getState)
		.then(() => {
			dispatch({
				type: UPDATING_NEW_BUILDS_BEGIN
			});
			const allBuilds = getState().builds.builds;
			const buildsList = _.values(allBuilds).filter((build) => {
				return !build.path && build.hasDownload();
			});


			const downloadBuilds = (builds) => {
				console.log('attempting download for builds', builds);
				let p = Promise.resolve(); // Q() in q

				builds.forEach(build =>
					p = p.then(() => {
						console.log('completed');
						return installDolphinMainFunction(build, dispatch, getState);
					}).catch((error) => {
						console.error('Retrieve and install failed');
						console.error(error);
					})
				);
				return p;
			};

			return downloadBuilds(buildsList);
		})
		.then(() => {
			dispatch({
				type: UPDATING_NEW_BUILDS_SUCCESS
			});
			console.log('promise fulfilled????');
		})
		.catch((error) => {
			dispatch({
				type: UPDATING_NEW_BUILDS_FAIL
			});
			console.error(error);
		});
};

const fetchBuildsMainFunction = (dispatch, getState) => {
	dispatch({
		type: FETCH_BUILDS_BEGIN
	});

	const convertBuildResponse = (response) => {
		if (!response) {
			response = electronSettings.get('buildsResponse', {});
			console.log('last saved response', response);
		}
		const savedBuildData = electronSettings.get('builds', {});
		if (!_.isEmpty(savedBuildData)) {
			_.each(savedBuildData, (build, i) => {
				savedBuildData[i] = Build.create(build);
			});
		}

		let builds = convertLadderBuildListToSomethingThatMakesSense(response);
		builds = combineWithSavedBuildData(builds, savedBuildData);

		if (!_.isEmpty(builds)) {
			dispatch({
				type: FETCH_BUILDS_SUCCESS,
				payload: {
					builds
				}
			});
			electronSettings.set('builds', builds);
			if (response && !_.isEmpty(response)) {
				electronSettings.set('buildsResponse', response);
			}
		} else {
			dispatch({
				type: FETCH_BUILDS_FAIL
			});
		}
		return builds;
	};


	return Promise.resolve()
		.then(() => {

			// Get cached data
			return convertBuildResponse();
		})
		.then(() => {
			// Get real data
			return getAuthenticationFromState(getState)
				.apiGet(endpoints.DOLPHIN_BUILDS, { default_game: Constants.MELEE_SMASHLADDER_GAME_ID });
		})
		.then((response) => {
			console.log('what is the response', response);
			return convertBuildResponse(response.builds);
		})
		.catch((error) => {
			console.error(error);
		})
		.then(() => {
			dispatch(updateReplayWatchProcesses());
		})
		.catch((error) => {
			console.error(error);
		});
};

export const retrieveBuilds = () => (dispatch, getState) => {
	fetchBuildsMainFunction(dispatch, getState);
};

const convertLadderBuildListToSomethingThatMakesSense = (ladderList) => {
	const buildList = {};
	_.forEach(ladderList, (buildData) => {
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
	_.forEach(rawBuildData, (build) => {
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
		const addRom = (romPath) => {
			dispatch(addRomPath(romPath));
		};
		const allowAnalytics = (set) => {
			dispatch(updateAllowDolphinAnalytics(set));
		};
		const updateSearchRomSetting = (set) => {
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
				dispatch(updateReplayWatchProcesses());
			})
			.catch((error) => {
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

export const promptToSetBuildPath = (build: Build) => (dispatch) => {
	dispatch({
		type: SET_BUILD_PATH_BEGIN,
		payload: build.id
	});
	return Files.selectFile(build.executableDirectory(), 'Select your Dolphin Executable')
		.then((selectedPath) => {
			if (selectedPath) {
				dispatch({
					type: SET_BUILD_PATH_SUCCESS
				});
				dispatch(setBuildPath(build, selectedPath));
				return;
			}
			dispatch({
				type: SET_BUILD_PATH_FAIL
			});
		})
		.catch((error) => {
			dispatch(buildFailError(SET_BUILD_PATH_FAIL, build, error));
		});
};

export const setBuildPath = (build: Build, newBuildPath) => (dispatch, getState) => {
	build.path = newBuildPath;
	dispatch(saveBuild(build, getState));
	if (build.executablePath()) {
		dispatch(mergeInitialSettingsIntoBuild(build));
	}
	dispatch(syncBuildsWithServer());
};

const installDolphinMainFunction = (build, dispatch, getState) => {
	const { dolphinInstallPath } = getState().dolphinSettings;

	if (getState().builds.downloadActive) {
		dispatch({
			type: DOWNLOAD_BUILD_ALREADY_ACTIVE
		});
		return false;
	}

	const basePath = path.join(dolphinInstallPath);
	console.log('downloading from', build.download_file);

	const baseName = `${Files.makeFilenameSafe(build.name + build.id)}`;
	const extension = path.extname(build.download_file);
	const baseNameAndExtension = `${baseName}${extension}`;
	const unzipLocation = path.join(basePath, baseName, '/');
	const zipWriteLocation = path.join(basePath, baseNameAndExtension);

	return Files.ensureDirectoryExists(basePath, 0o0755)
		.then(() => {
			dispatch({
				type: DOWNLOAD_BUILD_BEGIN,
				payload: {
					build
				}
			});

			return new Promise((resolve, reject) => {
				progress(request(build.download_file), {})
					.on('progress', (state) => {
						dispatch({
							type: BUILD_DOWNLOAD_PROGRESS_UPDATE,
							payload: {
								build,
								percent: state.percent
							}
						});
						console.log('progress', state);
					})
					.on('error', (err) => {
						console.error(err);
						dispatch({
							type: DOWNLOAD_BUILD_ERROR,
							payload: {
								build,
								error: err
							}
						});
						reject(err);
					})
					.once('finish', () => {
						console.log('finished!');
					})
					.on('end', () => {
						console.log('ended!');
						const error = new Error('File was not found... Probably');
						const stats = fs.statSync(zipWriteLocation);
						if (stats.size <= 30) {
							dispatch({
								type: DOWNLOAD_BUILD_ERROR,
								payload: {
									build,
									error: error
								}
							});
							reject(error);
							return;
						}


						// Do something after request finishes
						dispatch({
							type: DOWNLOAD_BUILD_SUCCESS,
							payload: {
								build
							}
						});
						dispatch({
							type: UNZIP_BUILD_BEGIN,
							payload: {
								build
							}
						});
						const updateUnzipDisplay = _.throttle((entry) => {
							dispatch({
								type: UNZIP_BUILD_PROGRESS_UPDATE,
								payload: {
									build,
									path: entry.path ? entry.path : null
								}
							});
						}, 100);
						switch (extension.toLowerCase()) {
							case '.zip':
								console.log('Before open zip', zipWriteLocation);
								multitry(500, 5, () => {
									fs.createReadStream(zipWriteLocation).pipe(
										unzipper
											.Extract({ path: unzipLocation })
											.on('close', () => {
												console.log('cllosed?');
												const dolphinLocation = Files.findInDirectory(unzipLocation, 'Dolphin.exe');
												console.log(dolphinLocation, 'what is dolphin lcoation');
												if (dolphinLocation.length) {
													dispatch(setBuildPath(build, dolphinLocation[0], true));
													dispatch(setDefaultPreferableNewUserBuildOptions(build));
													dispatch({
														type: UNZIP_BUILD_SUCCESS,
														payload: {
															build
														}
													});
													resolve();
												} else {
													const error = new Error('Could not find Dolphin.exe after extracting the archive');
													dispatch({
														type: UNZIP_BUILD_ERROR,
														payload: {
															build,
															error: error
														}
													});
													reject(error);
												}
											})
											.on('entry', updateUnzipDisplay)
											.on('error', (error) => {
												console.error(error);
												dispatch({
													type: UNZIP_BUILD_ERROR,
													payload: {
														build,
														downloading: null,
														unzipStatus: null,
														error: error.toString()
													}
												});
												reject(error);
											})
									);
								}).catch((error) => {
									console.log('unzip fail multiple times...');
									console.error(error);
									reject(error);
								});
								break;
							default: {
								const error = new Error('Could not extract archive! (Invalid Extension)');
								dispatch({
									type: UNZIP_BUILD_ERROR,
									payload: {
										build,
										downloading: null,
										unzipStatus: null,
										error: error
									}
								});
								reject(error);
							}
						}
					})
					.pipe(fs.createWriteStream(zipWriteLocation));
			});

		})
		.then(() => {
			console.log('ALL DONE WITH ', build.name);
		})
		.catch((error) => {
			dispatch({
				type: DOWNLOAD_BUILD_ERROR,
				payload: {
					build,
					error: error ? error.toString() : 'Error Downloading File...'
				}
			});
		});
};

export const downloadBuild = (build: Build) => (dispatch, getState) => {
	installDolphinMainFunction(build, dispatch, getState);
};

const syncBuildsWithServer = () => (dispatch, getState) => {
	const authentication = getAuthenticationFromState(getState);
	const { builds } = getState().builds;

	const buildIds = {};
	_.each(builds, (build) => {
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
		.catch((error) => {
			console.error(error);
			dispatch({
				type: SYNC_BUILDS_FAIL
			});
		});
};

const mergeInitialSettingsIntoBuild = (build) => (dispatch, getState) => {
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
		.catch((error) => {
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

export const startGame = () => (dispatch) => {
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

export const authotkeyAction = (event) => (dispatch) => {
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
			dispatch(updateReplayWatchProcesses()); // So that the replay list gets updated upon closing dolphin?
		})
		.catch((error) => {
			console.error(error);
			dispatch({
				type: CLOSE_BUILD_FAIL
			});
		});
};

const updateReplayWatchProcesses = () => (dispatch, getState) => {

	const state = getState();
	if (!state.login.sessionId) {
		console.warn('Ignore replay watch process since we are not logged in yet');
		return;
	}

	dispatch(beginWatchingForReplayChanges());
	dispatch(startReplayBrowser());
};

export const launchBuild = (build) => (dispatch) => {
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
		.catch((error) => {
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
	DolphinConfigurationUpdater.mergeSettingsIntoDolphinIni(build.executablePath(), {
		NetPlay: {
			NickName: state.login.player.username,
			HostCode: hostCode,
			TraversalChoice: 'traversal'
		}
	})
		.then(() => buildLauncher.join(build, hostCode))
		.then(() => {
			dispatch({
				type: JOIN_BUILD_SUCCESS,
				payload: {
					build
				}
			});
		})
		.catch((error) => {
			dispatch(buildFailError(JOIN_BUILD_FAIL, build, error));
			dispatch(closeDolphin());
		});
};

export const hostBuild = (build, game) => async (dispatch, getState) => {
	const authentication = getAuthenticationFromState(getState);
	console.log('what we get from host build', build, game, dispatch, getState);
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
	const dolphinIniSettingsToSet = {
		NetPlay: {
			TraversalChoice: 'traversal'
		}
	};
	if (state.login.player && state.login.player.username) {
		dolphinIniSettingsToSet.NetPlay.NickName = state.login.player.username;
	}

	DolphinConfigurationUpdater.mergeSettingsIntoDolphinIni(build.executablePath(), dolphinIniSettingsToSet)
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
		.catch((error) => {
			if (error && error.action === 'setup_netplay_host_failed') {
				dispatch(
					beginSelectingNewRomPath(`Select your ${game.name} ROM!`, hostBuild.apply(this, [build, game]))
				);
			}
			console.log('the error');
			console.error(error);
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

const getBuilds = (state) => state.builds.builds;

export const getSortedBuilds = createSelector(
	[getBuilds],
	(builds) => {
		return _.values(builds).sort((a, b) => {
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
			if (a.order !== b.order) {
				return a.order > b.order ? 1 : -1;
			}
			return 0;
		});
	}
);