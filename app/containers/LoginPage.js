// @flow
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import _ from 'lodash';

import Login from '../components/Login';

import Header from '../components/common/Header';
import Layout from '../components/common/Layout';
import Builds from '../components/Builds';
import * as BuildActions from '../actions/builds';
import * as LoginActions from '../actions/login';
import Button from '../components/elements/Button';

class LoginPage extends Component<Props> {

	constructor(props) {
		super(props);
		this.state = {
			buildsOpen: false
		};
		this.offlineLauncherMode = this.offlineLauncherMode.bind(this);
	}

	componentDidMount() {
		this.props.initializeBuildLauncher();
		this.props.retrieveBuilds();
	}

	offlineLauncherMode() {
		this.setState({
			buildsOpen: true
		});
	}

	render() {
		const { props } = this;
		const { builds } = props;
		const { buildsOpen } = this.state;
		const buildsAreEmpty = _.isEmpty(builds);
		return (
			<Layout>
				<Header
					productionUrls={props.productionUrls}
				/>
				<div className="row">
					<div className={`col ${buildsAreEmpty ? 'm12' : 'm12'}`}>
						<Login
							{...props}
						/>
					</div>
				</div>
				{!buildsAreEmpty &&
				<div className='row'>
					{!buildsOpen &&
					<div className='col m8'>
						<Button
							onClick={this.offlineLauncherMode}
						>
							Offline Launcher Mode
						</Button>
					</div>
					}
					{buildsOpen &&
					<div className='col m8'>
						<Builds {...props} />
					</div>
					}
				</div>
				}
			</Layout>
		);
	}
}

const mapStateToProps = state => ({
	...state.login,
	...state.builds,
	...state.dolphinSettings
});

function mapDispatchToProps(dispatch) {
	return bindActionCreators(
		{
			...BuildActions,
			...LoginActions
		},
		dispatch
	);
}

export default connect(mapStateToProps, mapDispatchToProps)(LoginPage);