import DolphinLauncher from "../utils/BuildLauncher";
import { requestMeleeIsoPath } from "./dolphinSettings";

const fs = require('fs');
const path = require('path');
const buildLauncher = new DolphinLauncher();

export const CHECK_FOR_REPLAYS = 'CHECK_FOR_REPLAYS';

export const LAUNCH_REPLAY_BEGIN = 'LAUNCH_REPLAY_BEGIN';
export const LAUNCH_REPLAY_SUCCESS = 'LAUNCH_REPLAY_SUCCESS';
export const LAUNCH_REPLAY_FAIL = 'LAUNCH_REPLAY_FAIL';
export const LAUNCH_REPLAY_END = 'LAUNCH_REPLAY_END';

export const setCheckForReplays = (yes) => {
	return {
		type: CHECK_FOR_REPLAYS,
		payload: yes
	};
};

const replayLaunchFail = (error)=>{
	console.error(error);
	return {
		type: LAUNCH_REPLAY_FAIL,
		payload: {
			error
		}
	};
};
export const launchReplay = ({replayPath, build, meleeIsoPath}) => (dispatch) => {
	const replayStatusPayload = {
		build,
		replayPath
	};
	dispatch({
		type: LAUNCH_REPLAY_BEGIN,
		payload: replayStatusPayload
	});

	const slippiReplayDirectory = build.getSlippiPath();
	const dolphinPath = build.executablePath();
	if(!replayPath)
	{
		return dispatch(replayLaunchFail('Invalid File Path'));
	}
	if(!meleeIsoPath)
	{
		dispatch(replayLaunchFail('A Melee Iso is Required'));
		return dispatch(requestMeleeIsoPath());
	}
	if(!slippiReplayDirectory)
	{
		return dispatch(replayLaunchFail('No Dolphin with Slippi Capabilities was found'));
	}

	const platform = process.platform;

	let commands;
	let command;
	let destinationFile = path.join(slippiReplayDirectory, 'CurrentGame.slp');
	const dolphinLaunchParameters = [];

	switch(platform)
	{
		case "darwin": // osx
			dolphinLaunchParameters.push('--args');
			dolphinLaunchParameters.push('-b');
			dolphinLaunchParameters.push('-e');
			commands = [
				`cp "${replayPath}" "${destinationFile}"`,
				`cd "${dolphinPath}"`,
				`open "Dolphin.app" --args -b -e "${meleeIsoPath}"`,
			];

			// Join the commands with && which will execute the commands in sequence
			command = commands.join(' && ');
			break;
		case "win32": // windows
			// 1) Copy file to the playback dolphin build with the name CurrentGame.slp
			// 2) Navigate to dolphin build path
			// 3) Run dolphin with parameters to launch melee directly
			commands = [
				`copy "${replayPath}" "${destinationFile}"`,
				`cd "${dolphinPath}"`,
				`Dolphin.exe /b /e "${meleeIsoPath}"`,
			];
			dolphinLaunchParameters.push('/b');
			dolphinLaunchParameters.push(`/e`);
			dolphinLaunchParameters.push(`${meleeIsoPath}`);

			// Join the commands with && which will execute the commands in sequence
			command = commands.join(' && ');
			break;
		default:
			return replayLaunchFail("The current platform is not supported");
	}

	fs.copyFile(replayPath, destinationFile, (error) => {
		if(error)
		{
			return replayLaunchFail(`Error copying replay file: ${error.message}`);
		}
		if(!build.setSlippiToPlayback())
		{
			return dispatch(replayLaunchFail('Could not find a settings file to enable Slippi Replay Playback'));
		}

		const cleanupDolphin = () =>{
			build.setSlippiToRecord();
			fs.unlink(destinationFile, (replayUnlinkError) => {
				if(replayUnlinkError)
				{
					console.error(error);
				}
			});
		};
		buildLauncher.launch(build, dolphinLaunchParameters)
			.then((dolphinProcess) => {
				dispatch({
					type: LAUNCH_REPLAY_SUCCESS,
					payload: replayStatusPayload
				});
				dolphinProcess.on('close', () => {
					cleanupDolphin();
					dispatch({
						type: LAUNCH_REPLAY_END,
						payload: replayStatusPayload,
					});
				})
			})
			.catch(launchErrors => {
				cleanupDolphin();
				replayLaunchFail(launchErrors);
			})
	});
};