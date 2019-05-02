// @flow
import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import login from './login';
import builds from './builds';
import replays from './replays';
import dolphinSettings from './dolphinSettings';
import autoUpdates from './autoUpdates';
import replayWatch from './replayWatch';
import replayBrowse from './replayBrowse';
import window from './window';
import dolphinStatus from './dolphinStatus';

const rootReducer = combineReducers({
	login,
	builds,
	replays,
	dolphinSettings,
	autoUpdates,
	replayWatch,
	replayBrowse,
	dolphinStatus,
	window,
	router
});

export default rootReducer;
