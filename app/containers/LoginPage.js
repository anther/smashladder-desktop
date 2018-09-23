// @flow
import React, { Component } from 'react';
import Login from '../components/Login';

import { setLoginKey } from "../actions/login";
import {connect} from "react-redux";

type Props = {};

class LoginPage extends Component<Props> {
  props: Props;

  render() {
    return <Login
      {...this.props}
    />;
  }
}

const mapStateToProps = state => {
  return {
      ...state.login
  }
};

export default connect(mapStateToProps, { setLoginKey } )(LoginPage);