import child from 'child_process';
import fs from "fs";
import path from 'path';
import DolphinChecker from "./DolphinChecker";
import Build from "./BuildData";

export default class DolphinLauncher {
	constructor(){
		this.child = null;
	}

	async launch(build, parameters){
		if(this.child)
		{
			// Recurse back and open again after closing the build
			return this.close()
				.then(() => this.launch(build, parameters));
		}
		return DolphinChecker.dolphinIsRunning()
			.then((isRunning) => {
				const errorMessage = 'Dolphin is already opened. Please close all instances of dolphin!';
				if(isRunning)
				{
					throw errorMessage;
				}
			})
			.then(() => this.launchChild(build, parameters))
			.catch(error => {throw error});
	}

	async close(){
		if(this.retrieveActiveDolphin())
		{
			const killPromise = new Promise((resolve) => {
				this.child.on('exit', () => {
					this.child = null;
					resolve();
				});
			});
			this.child.kill();
			return killPromise;
		}
		return true;
	}

	async launchChild(build: Build, parameters = []){
		return new Promise((resolve, reject) => {
			if(this.retrieveActiveDolphin())
			{
				console.log('has active already');
				return resolve(this.child);
			}
			if(!build.executablePath())
			{
				throw new Error(`Attempted to launch ${build.name} but where is the file?!`);
			}
			if(!fs.existsSync(build.executablePath()))
			{
				throw new Error(`Dolphin executable not found at ${build.executablePath()}`);
			}
			const childReference = this.child = child.spawn(path.resolve(build.executablePath()), parameters, {
				cwd: path.resolve(path.dirname(build.executablePath()))
			});

			const removeChildReference = () => {
				if(childReference === this.child)
				{
					this.child = null;
				}
			};
			this.child.on('exit', removeChildReference);
			this.child.on('close', removeChildReference);
			this.child.on('error', (err) => {
				if(err && err.toString().includes('ENOENT'))
				{
					reject(new Error(`Could not launch file at ${path.resolve(build.executablePath())}`));
				}
				reject(new Error('Failed To Launch'));
			});
			return resolve(this.child);
		});
	}

	retrieveActiveDolphin(){
		if(!this.child)
		{
			return null;
		}
		if(this.child.exitCode !== null)
		{
			this.child = null;
		}
		else
		{
			return this.child;
		}
	}

}