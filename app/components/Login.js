import React, {Component} from 'react';

import { Redirect } from 'react-router'

import Heading from './common/Heading';
import {endpoints, SmashLadderAuthentication} from '../utils/SmashLadderAuthentication';

type Props = {};

export default class Login extends Component {
	constructor(props){
		super(props);
		this.onLadderCodeChange = this.ladderCodeChange.bind(this);
	}

	componentWillMount(){
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
		return (
			<React.Fragment>
				<Heading/>
				<form className='login_form'>
					{!player &&
						<React.Fragment>
							{isLoggingIn && <h2>Logging In</h2>}
							{!isLoggingIn && <h2>Logged Out</h2>}
						</React.Fragment>
					}
					{player &&
						<h2>Logged In as {player.username}!</h2>
					}
					{!player &&
						<React.Fragment>
							<div className="input-field">
								<label htmlFor="ladder_code" className="">Ladder Code</label>
								<input
									disabled={this.props.isLoggingIn}
									onChange={this.onLadderCodeChange}
									type="password" name='ladder_code'
									value={this.props.loginCode}
									placeholder='Paste Retrieved Code Here'
									autoFocus={true}
								/>
							</div>
							<a className='retrieve_code' href={SmashLadderAuthentication.fullEndpointUrl(endpoints.LOGIN)} target='_blank'>Retrieve A Login Code</a>
						</React.Fragment>
					}

					{isLoggingIn &&
						<div>LOADING</div>
					}

					{loginErrors.length > 0 &&
						loginErrors.map((error, index)=>{
							return (
								<div key={index}>{error}</div>
							)
						})
					}

					<div className="preloader-wrapper small ">
						<div className="spinner-layer spinner-blue-only">
							<div className="circle-clipper left">
								<div className="circle"></div>
							</div>
							<div className="gap-patch">
								<div className="circle"></div>
							</div>
							<div className="circle-clipper right">
								<div className="circle"></div>
							</div>
						</div>
					</div>
				</form>
			</React.Fragment>
		);
	}
}