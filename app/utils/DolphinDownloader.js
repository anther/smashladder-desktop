import fs from 'fs';
var request = require('request');
const RequestProgress = require('request-progress');
const StringManipulator = require('./StringManipulator');
const unzip = require('unzip-stream');
const un7z = require('node-7z');
const EventEmitter = require('events');
const Files = require("./Files.js");
const constants = require('./constants');

/**
 \User\Config  to copy settings from one dolphin to another
 */
export class DolphinDownloader extends EventEmitter
{
	constructor(build){
		super();
		this.build = build;
		this.url = build.download_file;

		this.dolphinsDirectory = constants.root +'/dolphins/';
		if(!this.url)
		{
			throw new Error('No download link available');
		}
		this.progressIndicator = progressIndicator;
		this.downloadExtension = StringManipulator.getFileExtension(this.url);

		// this.url = "https://az412801.vo.msecnd.net/vhd/VMBuild_20141027/VirtualBox/IE11/Windows/IE11.Win8.1.For.Windows.VirtualBox.zip";
		this.request = null;
	}

	unzip(){
		let baseDirectory = this.dolphinsDirectory + this.baseSaveLocation;
		if(!fs.existsSync(this.dolphinsDirectory))
		{
			fs.mkdirSync(this.dolphinsDirectory);
		}
		if(!fs.existsSync(baseDirectory))
		{
			fs.mkdirSync(baseDirectory);
		}

		let finished = (success)=>{
			this.emit('unzipped', this.baseSaveLocation);
			this.statusText.text('Searching for Dolphin.exe...');

			let results = Files.findInDirectory(baseDirectory,'Dolphin.exe');
			if(results.length)
			{
				let path = results.pop();
				console.log('derp?');
				console.log('found', path);
				this.build.setPath(path);
				this.build.test();
			}
			else
			{
				this.statusText.text('Something went very wrong');
			}
			this.emit('finished');
			fs.unlinkSync(this.saveLocation);
		};
		console.log('downloaded');
		console.log(this.saveLocation);
		console.log(baseDirectory);
		if(this.downloadExtension.toLowerCase() == 'zip')
		{
			this.zip = fs.createReadStream(this.saveLocation);
			this.zip.pipe(unzip.Extract({ path: baseDirectory })).on('close',()=>{
				finished(true);
			});
		}
		else if(this.downloadExtension.toLowerCase() == '7z')
		{
			let myTask = new un7z();
			myTask.extractFull(this.saveLocation, baseDirectory, {})

			// Equivalent to `on('data', function (files) { // ... });`
				.progress(function (files) {
					console.log(files);
				})

				// When all is done
				.then(function () {
					finished(true);
				})

				// On error
				.catch(function (err) {
					finished(false);
					console.error(err);
				})

		}


		return this;
	}

	abort(){
		this.aborted = true;
		if(this.zip)
		{
			this.zip.unpipe();
			this.zip.destroy();
		}
		else if(this.request)
		{
			this.request.abort();
		}
		else
		{
			this.deleteZip();
		}
	}

	startDownload(saveLocation){
		if(this.request)
		{
			throw new Error('Request has already been started!');
		}
		this.baseSaveLocation = saveLocation;
		this.saveLocation = this.saveLocation = saveLocation
			+ (this.downloadExtension?'.'+this.downloadExtension:null);

		this.request = request(this.url);
		let progress = RequestProgress(this.request, {
			// throttle: 2000,                    // Throttle the progress event to 2000ms, defaults to 1000ms
			// delay: 1000,                       // Only start to emit after 1000ms delay, defaults to 0ms
			// lengthHeader: 'x-transfer-length'  // Length header to use, defaults to content-length
		})
			.on('progress', function (state) {
				// The state is an object that looks like this:
				// {
				//     percent: 0.5,               // Overall percent (between 0 to 1)
				//     speed: 554732,              // The download speed in bytes/sec
				//     size: {
				//         total: 90044871,        // The total payload size in bytes
				//         transferred: 27610959   // The transferred payload size in bytes
				//     },
				//     time: {
				//         elapsed: 36.235,        // The total elapsed seconds since the start (3 decimals)
				//         remaining: 81.403       // The remaining seconds to finish (3 decimals)
				//     }
				// }
				// this.progressIndicator.css('width', ""+(state.percent * 100) + '%');
				//
				// console.log('progress', state);
			})
			.on('error', function (err) {
				// Do something with err
			})
			.on('end', ()=> {
				if(this.aborted)
				{
					this.deleteZip();
					return;
				}
				try{
					this.unzip();
				}
				catch(e){
					this.emit('unzipError', e);
				}
			});

		progress.pipe(fs.createWriteStream(this.saveLocation));
		return progress;
	}
}