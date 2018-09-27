import React, {Component} from 'react';

import { Redirect } from 'react-router'

import {endpoints, SmashLadderAuthentication} from '../utils/SmashLadderAuthentication';
import Layout from "./common/Layout";
import ProgressIndeterminate from "./elements/ProgressIndeterminate";
import Button from "./elements/Button";

export default class Login extends Component {
	constructor(props){
		super(props);
		this.onLadderCodeChange = this.ladderCodeChange.bind(this);
		this.onLoginButtonClick = this.loginButtonClick.bind(this);
	}

	componentDidMount(){
		if(this.props.loginCode){
			this.props.setLoginKey(this.props.loginCode);
		}
	}

	ladderCodeChange(event){
		this.props.setLoginKey(event.target.value);
	}

	loginButtonClick(){
		this.props.setLoginKey(this.props.loginCode);
	}



	render(){
		const {isLoggingIn, player, loginErrors, showLoginButton, productionUrls} = this.props;
		if(player)
		{
			return <Redirect to="/builds" />
		}
		console.log(productionUrls);
		const authentication = SmashLadderAuthentication.create({
			productionUrls: productionUrls
		});
		return (
			<Layout>
				<form className='login_form'>
					{!player &&
						<React.Fragment>
							<div className="input-field">
								<input
									placeholder='Paste Login Code Here'
									disabled={this.props.isLoggingIn}
									onChange={this.onLadderCodeChange}
									type="password" name='ladder_code'
									value={this.props.loginCode || ''}
									autoFocus
								/>
								{showLoginButton &&
									<Button onClick={this.onLoginButtonClick} className='login_button'>Try Again</Button>
								}
							</div>
							<a className='retrieve_code' href={authentication.fullEndpointUrl(endpoints.LOGIN)} target='_blank'>Retrieve A Login Code</a>
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