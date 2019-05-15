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
import ladderWebsocket from './ladderWebsocket';
import tabs from './tabs';

const rootReducer = combineReducers({
	login,
	builds,
	replays,
	dolphinSettings,
	autoUpdates,
	replayWatch,
	replayBrowse,
	window,
	dolphinStatus,
	ladderWebsocket,
	tabs,
	router
});

export default rootReducer;
