// @flow
import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import login from './login';
import builds from './builds';
import replays from './replays';
import filePaths from './filePaths';

const rootReducer = combineReducers({
	login,
	builds,
	replays,
	filePaths,
	router
});

export default rootReducer;
