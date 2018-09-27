// @flow
import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import login from './login';
import builds from './builds';
import replays from './replays';
import dolphinSettings from './dolphinSettings';

const rootReducer = combineReducers({
	login,
	builds,
	replays,
	dolphinSettings,
	router
});

export default rootReducer;
