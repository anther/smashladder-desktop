import React, {Component} from 'react';

import { Redirect } from 'react-router'

import {endpoints, SmashLadderAuthentication} from '../utils/SmashLadderAuthentication';
import Layout from "./common/Layout";
import ProgressIndeterminate from "./elements/ProgressIndeterminate";

type Props = {};

export default class Login extends Component {
	constructor(props){
		super(props);
		this.onLadderCodeChange = this.ladderCodeChange.bind(this);
	}

	componentDidMount(){
		if(this.props.loginCode){
			this.props.setLoginKey(this.props.loginCode);
		}
	}

	ladderCodeChange(event){
		this.props.setLoginKey(event.target.value);
	}

	render(){
		const {isLoggingIn, player, loginErrors} = this.props;
		if(this.props.player)
		{
			return <Redirect to={'/builds'} />
		}
		console.log(loginErrors);
		return (
			<Layout>
				<form className='login_form'>
					{!player &&
						<React.Fragment>
							<div className="input-field">
								<label htmlFor="ladder_code" className="">Paste Login Code Here</label>
								<input
									disabled={this.props.isLoggingIn}
									onChange={this.onLadderCodeChange}
									type="password" name='ladder_code'
									value={this.props.loginCode || ''}
									autoFocus={true}
								/>
							</div>
							<a className='retrieve_code' href={SmashLadderAuthentication.fullEndpointUrl(endpoints.LOGIN)} target='_blank'>Retrieve A Login Code</a>
						</React.Fragment>
					}


					{loginErrors.length > 0 &&
						loginErrors.map((error, index)=>{
							return (
								<div className='error' key={index}>{error}</div>
							)
						})
					}

					{isLoggingIn &&
						<ProgressIndeterminate />
					}
				</form>
			</Layout>
		);
	}
}