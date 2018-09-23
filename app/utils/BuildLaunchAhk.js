"use strict";

import child from 'child_process';
import path from 'path';
const { app } = require('electron').remote;
app.getAppPath();
import DolphinResponse from "./DolphinResponse.js";
import DolphinActions from "./DolphinActions.js";

import BuildLauncher from './BuildLauncher';
import {Build} from "./BuildData";

export class BuildLaunchAhk
{
	constructor(){
		this.hotkey = null;
		this.buildLauncher = new BuildLauncher();
		// require ('hazardous');
		// const electron = require('electron');
		console.log(app.getAppPath());
		let appPath = app.getAppPath();

		const isDev = process.env.NODE_ENV === "development";
		appPath = './app';
		console.log(appPath);
		this.hotkeyLocation = path.join(appPath,'./external/ahk/NetPlayHotkeySL.exe');
		console.log('hotkey location', this.hotkeyLocation);
	}

	async launchHotKey(command, build){
		console.log(command);
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
						console.log('Hotkey Error: ' + err);
					});
					this.hotkey.stdout.on('data', (data) => {
						if(!data)
						{
							console.log('Empty?');
							return;
						}
						var strings = data.toString().split(/\r?\n/);
						for(var i in strings)
						{
							if(!strings.hasOwnProperty(i))
							{
								continue;
							}
							var stdout = strings[i];
							if(!stdout)
							{
								continue;
							}
							// console.log(stdout);
							stdout = JSON.parse(stdout);

							var result = DolphinResponse.ahkResponse(stdout);
							// console.log(result);
							if(DolphinActions.isCallable(result.action))
							{
								DolphinActions.call(result.action, build, result.value)
							}
							else
							{
							}
						}
					});
					if(!this.hotkey.pid)
					{
						throw 'Error loading up SmashQuickPlay';
					}
					this.hotkey.on('close', (e)=>{
						this.hotkey = null;
					});

					resolve(true);
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

	host(build: Build, gameLaunch){
		return this.buildLauncher
			.launch(build, null, true)
			.then((dolphinProcess)=>{
				console.log('adding launch?');
				build.addLaunch();
				if(dolphinProcess)
				{
					dolphinProcess.on('close', ()=>{
						this.killHotkey();
					});
				}
				var parameters = ['host'];
				parameters.push('Username');
				console.log('game launch?', gameLaunch);
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
				this.launchHotKey(parameters, build)
				return dolphinProcess;
			});
	}

	join(build, hostCode){
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