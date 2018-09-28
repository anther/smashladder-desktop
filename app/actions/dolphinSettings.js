export const ADD_ROM_PATH = 'ADD_ROM_PATH';
export const REMOVE_ROM_PATH = 'REMOVE_ROM_PATH';
export const UPDATE_SEARCH_SUBDIRECTORIES = 'UPDATE_SEARCH_SUBDIRECTORIES';
export const UPDATE_ALLOW_DOLPHIN_ANALYTICS = 'UPDATE_ALLOW_DOLPHIN_ANALYTICS';

export const addRomPath = path => (dispatch, getState) => {
  const state = getState();
  const paths = state.dolphinSettings.romPaths;
  if (path !== null) {
    paths[path] = path;
  }
  dispatch({
    type: ADD_ROM_PATH,
    payload: {
      romPaths: { ...paths }
    }
  });
};
export const removeRomPath = path => (dispatch, getState) => {
  const state = getState();
  const paths = state.dolphinSettings.romPaths;
  delete paths[path];
  dispatch({
    type: REMOVE_ROM_PATH,
    payload: {
      romPaths: { ...paths }
    }
  });
};

export const updateSearchRomSubdirectories = (checked: boolean) => {
  return {
    type: UPDATE_SEARCH_SUBDIRECTORIES,
    payload: {
      searchRomSubdirectories: checked
    }
  };
};
export const updateAllowDolphinAnalytics = (checked: boolean) => {
  return {
    type: UPDATE_ALLOW_DOLPHIN_ANALYTICS,
    payload: {
      allowDolphinAnalytics: checked
    }
  };
};
