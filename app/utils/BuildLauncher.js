import child from 'child_process';
import path from 'path';
import DolphinResponse from "./DolphinResponse";
import DolphinActions from "./DolphinActions";
import DolphinChecker from "./DolphinChecker";
import Build from "./BuildData";

export default class DolphinLauncher {
	constructor(){
		this.child = null;
	}

	async launch(build, parameters = [], closePrevious){
		if(closePrevious)
		{
			if(!this.child)
			{
				return DolphinChecker.dolphinIsRunning()
					.then((isRunning) => {
						const errorMessage = 'Dolphin is already opened. Please close all instances of dolphin!';
						if(isRunning)
						{
							throw errorMessage;
						}
					})
					.then(() => {
						return this.close();
					})
					.then(() => {
						return this.launchChild(build, parameters)
					})
					.catch(error => {
						throw error;
					});

			}
			return this.close()
				.then(() => {
					return this.launchChild(build, parameters)
				})
		}

		return this.launchChild(build, parameters);

	}

	async host(build: Build){
		return this.launchChild(build);
	}

	async join(build: Build){
		return this.launchChild(build);
	}

	_retrieveActiveChild(){
		if(this.child)
		{
			if(this.child.exitCode !== null)
			{
				this.child = null;
			}
			else
			{
				return this.child;
			}
		}
		return null;
	}

	async close(){
		if(this._retrieveActiveChild())
		{
			console.log('the child', this.child);
			const killPromise = new Promise((resolve) => {
				this.child.on('exit', () => {
					this.child = null;
					resolve();
				});
			});
			this.child.kill();
			return killPromise;
		}

		return Promise.resolve();

	}

	async launchChild(build: Build, parameters = []){
		return new Promise((resolve, reject) => {
			if(!parameters)
			{
				parameters = [];
			}

			if(!build.executablePath())
			{
				reject(new Error(`Attempted to launch ${build.name} but the path is not set!`));
				return;
			}

			if(this._retrieveActiveChild())
			{
				// Only one child allowed at a time, may consider throwing an error instead
				resolve(this.child);
				return;
			}

			this.child = child.spawn(path.resolve(build.executablePath()), parameters, {
				cwd: path.resolve(path.dirname(build.executablePath()))
			});

			this.child.on('error', (err) => {
				if(err && err.toString().includes('ENOENT'))
				{
					reject(new Error(`Could not launch file at ${path.resolve(build.executablePath())}`));
				}
				reject(new Error('Failed To Launch'));
			});

			this.child.stdout.on('data', (data) => {
				resolve(this.child);
				console.log(`stdout: ${  data}`);
				if(!data)
				{
					console.log('Empty?');
					return;
				}
				const strings = data.toString().split(/\r?\n/);
				console.log(data);
				for(const i in strings)
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

			const failTimeout = setTimeout(() => {
				if(!this.child.pid)
				{
					reject(new Error('Child not found!'));
				}
			}, 5000);
			if(this.child.pid)
			{
				clearTimeout(failTimeout);
				resolve(this.child);
			}
		});
	}

}