import React, { Component } from 'react';
import Button from './elements/Button';
import AlertBox from './elements/AlertBox';

export default class SetMeleeIsoAlertBox extends Component {

	render() {
		const isAllGood = this.props.meleeIsoPath && this.props.meleeIsoVerified;
		if (isAllGood) {
			return null;
		}
		return (
			<AlertBox>
				{isAllGood &&
				<p>
					Melee ISO All Set!
				</p>
				}
				{!isAllGood &&
				<div>
					<Button
						darkWaves
						className='white black-text'
						disabled={this.props.settingMeleeIsoPath}
						onClick={this.props.requestMeleeIsoPath}
					>
						{!this.props.meleeIsoPath &&
						<span>
							Set Melee Iso Path
						</span>
						}
						{this.props.meleeIsoPath &&
						<span>
							Change Melee Iso Path
						</span>
						}
					</Button>
				</div>
				}
				{this.props.verifyingMeleeIso &&
				<div>
					<i className='fa fa-cog fa-spin'/> Verifying
				</div>
				}
				{!this.props.verifyingMeleeIso && !this.props.meleeIsoVerified &&
				<div>
					<p className='flow-text'>
						{!this.props.meleeIsoPath &&
						<span>
						You need to set the file location that your Melee 1.02 ISO is stored in order for
						this application to work
						</span>
						}
						{this.props.meleeIsoPath &&
						<span>
						Your Melee ISO doesn't match the expected MD5 for Melee 1.02,
						this may cause issues such as Dolphin not being able to correctly load
						netplay codes or result in desyncs with other players.
						</span>
						}
						<div>{this.props.meleeIsoPath}</div>
					</p>
				</div>
				}
			</AlertBox>
		);
	}
}
