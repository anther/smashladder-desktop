// @flow
import React, { Component } from 'react';
import { connect } from "react-redux";
import Login from '../components/Login';

import { setLoginKey } from "../actions/login";

type Props = {};

class LoginPage extends Component<Props> {
	props: Props;

	render(){
		return <Login
			{...this.props}
		/>;
	}
}

const mapStateToProps = state => ({
	...state.login
});

export default connect(mapStateToProps, { setLoginKey })(LoginPage);