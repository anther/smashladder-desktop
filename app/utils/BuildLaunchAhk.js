/* eslint-disable no-restricted-syntax */
import child from 'child_process';

import EventEmitter from 'events';
import DolphinResponse from './DolphinResponse';
import DolphinActions from './DolphinActions';

import BuildLauncher from './BuildLauncher';
import Build from './BuildData';
import Files from './Files';

export default class BuildLaunchAhk extends EventEmitter {
	constructor(){
		super();
		this.buildLauncher = new BuildLauncher();
		this.activeProcess = new DolphinWithHotkeyPet();

		this.hotkeyLocation = Files.createApplicationPath(
			'./external/ahk/NetPlayHotkeySL.exe'
		);
		console.log('hotkey location', this.hotkeyLocation);
	}

	async launchHotKey(passedParameters: [], build, successOnAction = [], failOnActions = [], activeProcess){
		return new Promise((resolve, reject) => {
			console.log('launch hotkey with parameters', passedParameters);
			const parameters = [];
			parameters.push('/force');
			passedParameters.forEach((passedParameter) => {
				parameters.push(passedParameter);
			});

			const hotkey = child.spawn(this.hotkeyLocation, parameters);
			activeProcess.addHotkeyProcess(hotkey);
			hotkey.on('error', err => {
				hotkey.kill();
				reject(new Error(`Hotkey Error: ${err}`));
			});
			hotkey.on('exit', () => {
				reject(new Error('Closed Before Completing Requested Action'));
			});
			if(successOnAction.length === 1 && successOnAction[0] === true)
			{
				resolve({dolphinProcess: activeProcess, result: null, hotkeyProcess: hotkey});
			}
			hotkey.stdout.on('data', data => {
				if(!data)
				{
					console.log('Empty?');
					return;
				}
				const strings = data.toString().split(/\r?\n/);
				for(const string of strings)
				{
					if(!string)
					{
						continue;
					}
					const stdout = JSON.parse(string);
					const result = DolphinResponse.ahkResponse(stdout);

					this.emit('ahkEvent', result);
					if(DolphinActions.isCallable(result.action))
					{
						const callResult = DolphinActions.call(
							result.action,
							build,
							result.value
						);
						if(callResult && successOnAction.includes(result.action))
						{
							resolve({dolphinProcess: activeProcess, result: result, hotkeyProcess: hotkey});
						}
					}
					if(successOnAction.includes(result.action))
					{
						resolve({dolphinProcess: activeProcess, result: result, hotkeyProcess: hotkey});
					}
					if(failOnActions.includes(result.action))
					{
						hotkey.kill();
						reject(result);
					}
				}
			});
		});
	}

	async startGame(){
		return this.launchHotKey(
			['launch'],
			null,
			['start_game_success'],
			['start_game_error'],
			this.activeProcess
		);
	}

	async launch(build: Build){
		if(!build)
		{
			throw new Error('Build is required!');
		}
		const parameters = ['launch'];
		parameters.push('Temp Username');
		parameters.push(build.name);

		console.log('launch click?');
		return this.startBuild(build, parameters, [true]);
	}

	async close(){
		return this.buildLauncher.close();
	}

	async join(build: Build, hostCode){
		if(!hostCode)
		{
			throw new Error('IP Address or Host code is required to join!');
		}
		console.log('the host code', hostCode);
		console.error('how we get here');
		const parameters = ['join'];
		parameters.push('UnusedUsername');
		parameters.push(hostCode);
		parameters.push(build.name);

		// ** Maybe find a the popup that displays that the join failed
		return this.startBuild(build, parameters, ['lobby_join', 'player_list_info']);
	}

	async host(build: Build, gameLaunch){
		if(!gameLaunch)
		{
			throw new Error('A Game is Required to host!');
		}
		const parameters = [];
		parameters.push('host');
		parameters.push('UsernameUnused');
		if(gameLaunch.id)
		{
			build.addGameLaunch(gameLaunch.id);
		}
		parameters.push(gameLaunch.dolphin_game_id_hint);
		parameters.push(gameLaunch.name);
		parameters.push(build.name);

		return this.startBuild(build, parameters, ['host_code'], [
			'setup_netplay_host_failed',
			'setup_netplay_host_failed_empty_list'
		]);
	}

	async startBuild(build, parameters, successMessages, failMessages){
		let theActiveProcess = null;
		console.log('beginning basic launch process');
		return this.activeProcess.murder()
			.then(() => {
				return this.buildLauncher.launch(build);
			})
			.then(dolphinProcess => {
				this.activeProcess = new DolphinWithHotkeyPet(dolphinProcess);
				theActiveProcess = this.activeProcess;
				return this.launchHotKey(parameters, build, successMessages, failMessages, theActiveProcess);
			})
			.catch(error=>{
				console.error(error);
				throw error;
			});
	}

}

class DolphinWithHotkeyPet {
	constructor(dolphinProcess){
		this.hotkeyProcesses = new Set();
		this.murdered = false;
		if(!dolphinProcess)
		{
			console.log('had no dolphin process!');
			this.stopsRunning = Promise.resolve();
			return;
		}
		this.dolphinProcess = dolphinProcess;
		this.stopsRunning = new Promise((resolve)=>{
			if(this.murdered)
			{
				return resolve();
			}

			dolphinProcess.on('close', () => {
				resolve();
				this.murdered = true;
				this.murder().catch((error) => {
					console.error(error)
				});
			});
		});
	}

	async murder(){
		this.hotkeyProcesses.forEach((hotkeyProcess) => {
			hotkeyProcess.kill();
		});
		if(this.murdered)
		{
			return this.stopRunning;
		}
		if(!this.dolphinProcess || this.dolphinProcess.exitCode !== null)
		{
			this.murdered = true;
			return this.stopRunning;
		}
		this.dolphinProcess.kill();
		return this.stopRunning;
	}

	addHotkeyProcess(hotkeyProcess){
		// ...Not entirely sure why this list is stored since we're killing them as new ones are added...
		this.hotkeyProcesses.forEach((process)=>{
			process.kill();
		});
		this.hotkeyProcesses.add(hotkeyProcess);
	}

}