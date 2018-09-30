import fse from 'fs-extra';
import path from 'path';
import DolphinLauncher from "../utils/BuildLauncher";
import { requestMeleeIsoPath } from "./dolphinSettings";
import Constants from "../utils/Constants";

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
export const launchReplay = ({replayPath, build, meleeIsoPath}) => (dispatch, getState) => {
	const replayStatusPayload = {
		build,
		replayPath,
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
	let destinationFile = path.join(slippiReplayDirectory, Constants.SLIPPI_REPLAY_FILE_NAME);
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
			break;
		case "win32": // windows
			dolphinLaunchParameters.push('/b');
			dolphinLaunchParameters.push(`/e`);
			dolphinLaunchParameters.push(`${meleeIsoPath}`);
			break;
		default:
			return replayLaunchFail("The current platform is not supported");
	}

	buildLauncher.close()
		.catch(error=>{
			dispatch(replayLaunchFail(error));
			throw error;
		})
		.then(()=>{
			console.log('unlink done');
			return fse.copyFile(replayPath, destinationFile);
		})
		.catch(error=>{
			return dispatch(replayLaunchFail(`Error copying replay file: ${error.message}`));
		})
		.then(()=>{
			console.log('change slippi to playback');
			if(!build.setSlippiToPlayback())
			{
				return dispatch(replayLaunchFail('Could not find a settings file to enable Slippi Replay Playback'));
			}

			const cleanupDolphin = () =>{
				build.setSlippiToRecord();
				fse.unlink(destinationFile, (replayUnlinkError) => {
					if(replayUnlinkError)
					{
						console.error(replayUnlinkError);
					}
				});
			};
			console.log('launching build');
			buildLauncher.launch(build, dolphinLaunchParameters)
				.then((dolphinProcess) => {
					dispatch({
						type: LAUNCH_REPLAY_SUCCESS,
						payload: replayStatusPayload
					});
					dolphinProcess.on('close', () => {
						const state = getState();
						// This is to prevent a cleanup happening concurrently with another build launching
						if(!state.replays.launchingReplay)
						{
							cleanupDolphin();
							dispatch({
								type: LAUNCH_REPLAY_END,
								payload: replayStatusPayload,
							});
						}
					})
				})
				.catch(launchErrors => {
					cleanupDolphin();
					dispatch(replayLaunchFail(launchErrors));
				})
		})
		.catch((error)=>{
			console.error(error);
		});
};