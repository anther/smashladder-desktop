"use strict";

import child from 'child_process';
const { app } = require('electron').remote;
import DolphinResponse from "./DolphinResponse.js";
import DolphinActions from "./DolphinActions.js";

import BuildLauncher from './BuildLauncher';
import {Build} from "./BuildData";
import {Files} from "./Files";

export class BuildLaunchAhk
{
	constructor(){
		this.hotkey = null;
		this.buildLauncher = new BuildLauncher();
		// require ('hazardous');
		// const electron = require('electron');
		console.log(app.getAppPath());

		this.hotkeyLocation = Files.createApplicationPath('./external/ahk/NetPlayHotkeySL.exe');
		console.log('hotkey location', this.hotkeyLocation);
	}

	async launchHotKey(command, build, successOnAction = ''){
		return new Promise((resolve,reject)=>{
			this.killHotkey()
				.then(()=>{
					const parameters = [];
					parameters.push('/force');
					if(typeof command === 'string')
					{
						parameters.push(command);
					}
					else
					{
						for(var i in command)
						{
							if(command.hasOwnProperty(i))
							{
								parameters.push(command[i]);
							}
						}
					}
					console.log('Opening Smash Quick Play SL', parameters);
					this.hotkey = child.spawn(this.hotkeyLocation, parameters);
					this.hotkey.on('error', function(err) {
						reject(`Hotkey Error: ${err}`);
					});
					this.hotkey.stdout.on('data', (data) => {
						if(!data)
						{
							console.log('Empty?');
							return;
						}
						var strings = data.toString().split(/\r?\n/);
						for(const string of strings)
						{
							if(!string)
							{
								continue;
							}
							const stdout = JSON.parse(string);
							console.log(stdout);

							var result = DolphinResponse.ahkResponse(stdout);
							// console.log(result);
							if(DolphinActions.isCallable(result.action))
							{
								const callResult = DolphinActions.call(result.action, build, result.value)
								if(result.action === 'host_code' && callResult)
								{
									resolve(callResult);
								}
							}
						}
					});
					if(!this.hotkey.pid)
					{
						throw new Error('Error loading up SmashQuickPlay, never received a process id');
					}
					this.hotkey.on('close', (e)=>{
						this.hotkey = null;
						reject('AutoHotKey Attempt Closed');
					});
				})
		})
	}

	async killHotkey(){
		if(this.hotkey){
			return new Promise((resolve, reject)=>{
				console.log('Killing Hotkey');
				this.hotkey.kill();

				var checkForDeadHotkey = ()=>{
					if(this.hotkey === null)
					{
						setTimeout(()=>{
							console.log('WAS KILLED');
							resolve();
						},500)
					}
					else
					{
						this.hotkey.kill();
						setTimeout(()=>{
							checkForDeadHotkey()
						}, 250);
					}
				};
				checkForDeadHotkey();

			});
		}
		else
		{
			return Promise.resolve();
		}
	}

	startGame(){
		console.log('command to start game');
		this.launchHotKey('launch');
	}

	launch(build){
		console.trace('at open');
		return this.buildLauncher
			.launch(build, null, true)
			.then((child)=>{
				console.log('launching?');
				const dolphinProcess = this.buildLauncher.child;
				if(dolphinProcess)
				{
					dolphinProcess.on('close', ()=>{
						this.killHotkey();
					});
				}
				var parameters = ['launch'];
				parameters.push('Temp Username');
				parameters.push(build.name);
				return this.launchHotKey(parameters, build)
			})
			.catch((error)=>{
				throw error;
			});
	}

	async close(){
		return this.buildLauncher.close();
	}

	async host(build: Build, gameLaunch){
		let outerDolphinProcess = null;
		if(!gameLaunch)
		{
			throw new Error('A Game is Required to host!');
		}
		const dolphinPromise = this.buildLauncher
			.launch(build, null, true)
			.then((dolphinProcess)=> {
				build.addLaunch();
				if(dolphinProcess)
				{
					dolphinProcess.on('close', () => {
						this.killHotkey();
					});
				}
				return dolphinProcess;
			});
		const hotkeyPromise = dolphinPromise.then(()=>{
			const parameters = ['host'];
			parameters.push('Username');
			if(gameLaunch)
			{
				if(gameLaunch.id)
				{
					build.addGameLaunch(gameLaunch.id);
				}
				parameters.push(gameLaunch.dolphin_game_id_hint);
				parameters.push(gameLaunch.name);
				parameters.push(build.name);
			}
			return this.launchHotKey(parameters, build, 'host_code');
		});
		return Promise.all([dolphinPromise, hotkeyPromise]);
	}

	async join(build, hostCode){
		if(!hostCode)
		{
			throw new Error('IP Address or Host code is required to join!');
		}
		return this.buildLauncher
			.launch(build, null, this.closePrevious)
			.then((newChild)=>{
				if(!newChild)
				{
					throw 'Dolphin already open!';
				}
				return new Promise((resolve, reject)=>{
					var parameters = ['join'];
					parameters.push('Username');
					parameters.push(hostCode);
					parameters.push(build.name);
					this.launchHotKey(parameters, build)
						.then(()=>{
							resolve();
						})
						.catch(()=>{
							reject()
						});
				});
			})
			.then(()=>{
				const dolphinProcess = BuildLauncher.child;
				if(dolphinProcess)
				{
					dolphinProcess.on('close', ()=>{
						this.killHotkey();
					});
				}
				var hostCodeElement = build.element.find('.host_code');

			})
			.then(()=>{
				console.log('resolved?');
			})
	}


}