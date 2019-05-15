import React, { Component } from 'react';
import Steps, { Step } from 'rc-steps';
import Button from './elements/Button';

export default class QuickSetup extends Component {

	render() {
		const { currentStep, selectingRomPath, meleeIsoPath, requestMeleeIsoPath, verifyingMeleeIso, meleeIsoVerified } = this.props;
		return (
			<div>
				<Steps current={currentStep}>
					<Step
						title="first"
						description='Select Melee ISO'
					/>
					<Step
						title="first"
						description='Select Melee ISO'
					/>
					<Step
						title="first"
						description='Select Melee ISO'
					/>
				</Steps>

				{currentStep === 0 &&
				<div>
					<div className='row'>
						<div className='col m12'>
							<p>Click the find ISO button to set the location that you have saved your Melee ISO</p>
							<Button
								disabled={this.props.settingMeleeIsoPath}
								onClick={this.props.requestMeleeIsoPath}
							>
								Select Melee Iso
							</Button>

							<div>
								<div>Melee ISO Path</div>
								<div>{meleeIsoPath}</div>
							</div>
						</div>
					</div>
				</div>
				}

				{currentStep === 1 &&
				<div>
					<div className='row'>
						<p className='col m12'>Do you need to Install Dolphin or do you already have it installed?</p>
					</div>
					<div className='row'>
						<div className='col m6'>
							<Button
								className='btn-success'
							>
								Install Them!
							</Button>
						</div>
						<div className='col m6'>
							<Button
							>
								I will do it Manually!
							</Button>
						</div>
					</div>
				</div>
				}

				{currentStep === 2 &&
				<div>
					Rawr
				</div>
				}

			</div>
		);
	}
}