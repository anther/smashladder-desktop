"use strict";

import DolphinResponse from "./DolphinResponse.js";
import DolphinActions from "./DolphinActions.js";
import DolphinChecker from "./DolphinChecker";
import {Build} from "./BuildData";
import child from 'child_process';


export default class DolphinLauncher{
	constructor(){
		this.child = null;
	}

	async launch(build, parameters = [], closePrevious){
		if(closePrevious)
		{
			if(!this.child)
			{
				if(DolphinChecker.dolphinIsRunning())
				{
					throw new Error('Dolphin is already opened. Please close all instances of dolphin!');
				}
			}
			return this.close()
				.then(()=>{
					return this.launchChild(build, parameters)
				})
		}
		else
		{
			return this.launchChild(build, parameters);
		}
	}

	async host(build: Build){
		return this.launchChild(build);
	}

	async join(build: Build){
		return this.launchChild(build);
	}

	async close(){
		if(this.child)
		{
			const killPromise = new Promise((resolve, reject) => {
				this.child.on('close', (e)=>{
					this.child = null;
					resolve();
				});
			});
			this.child.kill();
			return killPromise;
		}
		else
		{
			return Promise.resolve();
		}
	}

	launchChild(build: Build, parameters = []){
		if(!parameters)
		{
			parameters = [];
		}

		if(!build.executablePath())
		{
			throw new Error('Attempted to launch '+ build.name + ' but the path is not set!');
		}

		if(this.child)
		{
			//Only one child allowed at a time, may consider throwing an error instead
			return Promise.resolve(this.child);
		}


		this.child = child.spawn(build.executablePath(), parameters, {
			cwd: require('path').dirname(build.executablePath())
		});

		console.log('[PID]',this.child.pid);

		this.child.stdout.on('data', (data) => {
			console.log('stdout: ' + data);
			if(!data)
			{
				console.log('Empty?');
				return;
			}
			const strings = data.toString().split(/\r?\n/);
			console.log(data);
			for(let i in strings)
			{
				if(!strings.hasOwnProperty(i))
				{
					continue;
				}
				const stdout = strings[i];
				if(!stdout)
				{
					continue;
				}

				const result = DolphinResponse.parse(stdout);
				if(DolphinActions.isCallable(result.action))
				{
					build.changeIsSmartDolphin(true);
					if(!build.isTesting)
					{
						DolphinActions.call(result.action, build, result.value)
					}
				}
				else
				{
					console.warn('Unusable stdout', result);
				}
			}
		});
		return Promise.resolve(this.child);
	}

}