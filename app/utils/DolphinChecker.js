export default class DolphinProcessChecker
{
	static dolphinIsRunning(){
		const pid = DolphinProcessChecker.getDolphinPid();
		return !!pid;
	}

	static getDolphinPid(){
		return null;
		var pid = winprocess.getProcessId("Dolphin.exe");
		if(pid < 0)
		{
			return null;
		}
		return pid;
	}
}