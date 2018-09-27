// @flow
import React, { Component } from 'react';
import { connect } from "react-redux";
import Login from '../components/Login';

import { setLoginKey } from "../actions/login";
import Header from "../components/common/Header";
import Layout from "../components/common/Layout";

class LoginPage extends Component<Props> {
	render(){
		return (
			<Layout>
				<Header
					productionUrls={this.props.productionUrls}
				/>
				<Login
					{...this.props}
				/>
			</Layout>
		);
	}
}

const mapStateToProps = state => ({
	...state.login
});

export default connect(mapStateToProps, { setLoginKey })(LoginPage);