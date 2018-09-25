const exec = require('child_process').exec;

export default class DolphinProcessChecker {
	static async dolphinIsRunning(){
		return DolphinProcessChecker.isRunning('Dolphin.exe', 'dolphin', 'dolphin');

	}

	static async isRunning(win, mac, linux){
		return new Promise(function(resolve, reject){
			const plat = process.platform
			const cmd = plat == 'win32' ? 'tasklist' : (plat == 'darwin' ? 'ps -ax | grep ' + mac : (plat == 'linux' ? 'ps -A' : ''))
			const proc = plat == 'win32' ? win : (plat == 'darwin' ? mac : (plat == 'linux' ? linux : ''))
			if(cmd === '' || proc === '')
			{
				resolve(false)
			}
			exec(cmd, function(err, stdout, stderr){
				resolve(stdout.toLowerCase().indexOf(proc.toLowerCase()) > -1)
			})
		})
	}
}