// @flow
import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import login from './login';
import builds from './builds';
import replays from './replays';

const rootReducer = combineReducers({
  login,
  builds,
  replays,
  router
});

export default rootReducer;
