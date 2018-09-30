/* eslint-disable no-restricted-syntax */
import electronSettings from 'electron-settings';
import _ from 'lodash';
import { endpoints } from '../utils/SmashLadderAuthentication';
import Build from '../utils/BuildData';
import BuildLaunchAhk from '../utils/BuildLaunchAhk';
import getAuthenticationFromState from '../utils/getAuthenticationFromState';
import DolphinConfigurationUpdater from '../utils/DolphinConfigurationUpdater';

import {
	addRomPath, beginSelectingNewRomPath,
	updateAllowDolphinAnalytics,
	updateSearchRomSubdirectories
} from './dolphinSettings';

export const FETCH_BUILDS_BEGIN = 'FETCH_BUILDS_BEGIN';
export const FETCH_BUILDS_SUCCESS = 'FETCH_BUILDS_SUCCESS';
export const FETCH_BUILDS_FAIL = 'FETCH_BUILDS_FAIL';
export const COPIED_BUILD_SETTINGS = 'COPIED_BUILD_SETTINGS';

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

export const START_GAME_BEGIN = 'START_GAME_BEGIN';
export const START_GAME_SUCCESS = 'START_GAME_SUCCESS';
export const START_GAME_FAIL = 'START_GAME_FAIL';

export const MERGE_SETTINGS_INTO_BUILD_BEGIN = 'MERGE_SETTINGS_INTO_BUILD_BEGIN';
export const MERGE_SETTINGS_INTO_BUILD_SUCCESS = 'MERGE_SETTINGS_INTO_BUILD_SUCCESS';
export const MERGE_SETTINGS_INTO_BUILD_FAIL = 'MERGE_SETTINGS_INTO_BUILD_FAIL';

export const AUTOHOTKEY_EVENT = 'AUTOHOTKEY_ACTION';

const buildLauncher = new BuildLaunchAhk();

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
    DolphinConfigurationUpdater.copyInitialSettingsFromBuild(
      build.executablePath(),
      addRom,
      allowAnalytics,
      updateSearchRomSetting
    )
      .then(() => {
        dispatch({
          type: COPIED_BUILD_SETTINGS,
          payload: {
            builds: currentBuilds
          }
        });
      })
      .catch(error => {
        console.error(error);
      });
  }
};

export const setBuildPath = (
  build: Build,
  path,
) => (dispatch, getState) => {
  build.path = path;
  dispatch(saveBuild(build, getState));
  if(build.executablePath())
  {
    dispatch(mergeInitialSettingsIntoBuild(build));
  }
};

export const mergeInitialSettingsIntoBuild = (build) => (dispatch, getState) => {
	const state = getState();
	dispatch({
        type: MERGE_SETTINGS_INTO_BUILD_BEGIN
    });
	if(!build)
    {
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
                payload: build
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

// export const authotkeyAction = event => (dispatch) =>{
// 	dispatch({
// 		type: AUTOHOTKEY_EVENT,
// 		payload: {
// 			event: event
// 		}
// 	});
// };
// buildLauncher.on('ahkEvent', event => (dispatch) => {
//   authotkeyAction(event);
// });

export const closeDolphin = () => dispatch => {
  // const authentication = getAuthenticationFromState(getState);
  buildLauncher
    .close()
    .then(() => {
      dispatch({
        type: CLOSE_BUILD
      });
      // authentication.apiPost(endpoints.CLOSED_DOLPHIN);
    })
    .catch(error => {
      console.error(error);
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
  build.setSlippiToRecord();
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

export const hostBuild = (build, game) => (dispatch, getState) => {
  const authentication = getAuthenticationFromState(getState);
  const state = getState();
  dispatch({
    type: HOST_BUILD_BEGIN,
    payload: {
      build,
      game
    }
  });

  dispatch(mergeInitialSettingsIntoBuild(build));
  build.setSlippiToRecord();
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
        if(error && error.action === "setup_netplay_host_failed")
        {
          dispatch(beginSelectingNewRomPath(`Select Rom Folder that contains ${game.name}`));
        }
      console.log('the error', error);
      dispatch(buildFailError(HOST_BUILD_FAIL, build, error));
      dispatch(closeDolphin());
    });
};

const buildFailError = (type, build, error) => {
  console.error(error);
  if(error && error.value)
  {
    error = error.value;
  }
  return {
    type: HOST_BUILD_FAIL,
    payload: {
      buildError: {
        for: build.id,
        error: String(error)
      }
    }
  };
};
