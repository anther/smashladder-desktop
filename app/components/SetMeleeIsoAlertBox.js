import React, { Component } from 'react';
import Button from './elements/Button';
import AlertBox from './elements/AlertBox';

export default function SetMeleeIsoAlertBox({
	                                            requestMeleeIsoPath, meleeIsoPathErrorHash,
	                                            settingMeleeIsoPath,
	                                            meleeIsoPathError, meleeIsoPath, meleeIsoPathErrorConfirmed, meleeIsoVerified, verifyingMeleeIso
                                            }) {

	function requestIsoClick() {
		requestMeleeIsoPath();
	}

	const isAllGood = meleeIsoPath && meleeIsoVerified && !meleeIsoPathError;
	if (isAllGood) {
		return null;
	}
	if (meleeIsoPathErrorHash !== null && meleeIsoPathErrorHash === meleeIsoVerified) {
		return null;
	}
	return (
		<AlertBox
			onClose={meleeIsoPathErrorConfirmed}
		>
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
					disabled={settingMeleeIsoPath}
					onClick={requestIsoClick}
				>
					{!meleeIsoPath &&
					<span>
						Set Melee Iso Path
					</span>
					}
					{meleeIsoPath &&
					<span>
						Change Melee Iso Path
					</span>
					}
				</Button>
			</div>
			}
			{verifyingMeleeIso &&
			<div>
				<i className='fa fa-cog fa-spin'/> Verifying
			</div>
			}
			{!verifyingMeleeIso &&
			<div>
				<p className=''>
					{!meleeIsoPath &&
					<span>
						You need to set the file location that your Melee 1.02 ISO is stored in order for
						this application to work
						</span>
					}
					{!!meleeIsoPath &&
					<span>
							<div>
							{!!meleeIsoPathError && <span>{meleeIsoPathError}</span>}
							</div>
							<div>
								<span>
									Your Melee ISO doesn't match the expected MD5 for Melee 1.02,
									this may cause issues such as Dolphin not being able to correctly load
									netplay codes or result in desyncs with other players.
								</span>
							</div>
						</span>
					}
					<div>
						<a
							rel='noopener noreferrer'
							target='_blank'
							href='https://www.smashladder.com/guides/view/26cn/melee/hashes-of-melee-isos'>
							Read Here For More Info
						</a>
					</div>
					<div>{meleeIsoPath}</div>
				</p>
			</div>
			}
		</AlertBox>
	);
}
