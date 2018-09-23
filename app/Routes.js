/* eslint flowtype-errors/show-errors: 0 */
import React from 'react';
import { Switch, Route } from 'react-router';
import routes from './constants/routes.json';
import App from './containers/App';
import LoginPage from './containers/LoginPage';
import BuildsPage from './containers/BuildsPage';

export default () => (
  <App>
    <Switch>
      <Route path={routes.BUILDS} component={BuildsPage} />
      <Route path={routes.HOME} component={LoginPage} />
    </Switch>
  </App>
);
