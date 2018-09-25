"use strict";

import DolphinResponse from "./DolphinResponse.js";
import DolphinActions from "./DolphinActions.js";
import DolphinChecker from "./DolphinChecker";
import {Build} from "./BuildData";
import child from 'child_process';
import path from 'path';

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

	async launchChild(build: Build, parameters = []){
		return new Promise((resolve, reject)=>{
			if(!parameters)
			{
				parameters = [];
			}

			if(!build.executablePath())
			{
				reject('Attempted to launch '+ build.name + ' but the path is not set!');
				return;
			}

			if(this.child)
			{
				//Only one child allowed at a time, may consider throwing an error instead
				resolve(this.child);
				return;
			}

			this.child = child.spawn(path.resolve(build.executablePath()), parameters, {
				cwd: path.resolve(require('path').dirname(build.executablePath()))
			});

			this.child.on('error', (err) => {
				if(err && err.toString().includes('ENOENT'))
				{
					reject('Could not launch file at ' + path.resolve(build.executablePath()));
				}
				reject('Failed To Launch');
			});

			this.child.stdout.on('data', (data) => {
				resolve(this.child);
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

			const failTimeout = setTimeout(()=>{
				if(!this.child.pid)
				{
					reject('Child not found!');
				}
			},5000);
			if(this.child.pid)
			{
				clearTimeout(failTimeout);
				resolve(this.child);
			}
		});
	}

}