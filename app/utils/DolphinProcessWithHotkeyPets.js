export default class DolphinProcessWithHotkeyPets {
	constructor(dolphinProcess){
		this.hotkeyProcesses = new Set();
		this.murdered = false;
		if(!dolphinProcess)
		{
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