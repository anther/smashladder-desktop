const { dialog } = require('electron').remote;

export class Files
{

	static _openDialogSelectOne(options){
		return new Promise((resolve, reject)=>{
			dialog.showOpenDialog(options, (paths)=>{
				if(paths && paths.length > 0)
				{
					return resolve(paths[0]);
				}
				else
				{
					return null;
				}
			});
		})
	}

	static selectFile(){
		return Files._openDialogSelectOne({properties: ['openFile']});
	}

	static selectDirectory(){
		return Files._openDialogSelectOne({properties: ['openDirectory']});
	}

}