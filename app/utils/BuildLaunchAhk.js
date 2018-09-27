/* eslint-disable no-restricted-syntax */
import child from 'child_process';

import EventEmitter from 'events';
import DolphinResponse from './DolphinResponse';
import DolphinActions from './DolphinActions';

import BuildLauncher from './BuildLauncher';
import Build from './BuildData';
import Files from './Files';

const { app } = require('electron').remote;

export default class BuildLaunchAhk extends EventEmitter {
  constructor() {
    super();
    this.hotkey = null;
    this.buildLauncher = new BuildLauncher();
    // require ('hazardous');
    // const electron = require('electron');
    console.log(app.getAppPath());

    this.hotkeyLocation = Files.createApplicationPath(
      './external/ahk/NetPlayHotkeySL.exe'
    );
    console.log('hotkey location', this.hotkeyLocation);
  }

  async launchHotKey(command, build, successOnAction = [], failOnActions = []) {
    if (typeof successOnAction === 'string') {
      successOnAction = [successOnAction];
    }
    if (typeof failOnActions === 'string') {
      failOnActions = [failOnActions];
    }
    console.log('hotkey before', this.hotkey);
    return new Promise((resolve, reject) => {
      return this.killHotkey().then(() => {
        const parameters = [];
        parameters.push('/force');
        if (typeof command === 'string') {
          parameters.push(command);
        } else {
          for (const i in command) {
            if (command.hasOwnProperty(i)) {
              parameters.push(command[i]);
            }
          }
        }
        this.hotkey = child.spawn(this.hotkeyLocation, parameters);
        this.hotkey.on('error', err => {
          this.hotkey.kill();
          reject(new Error(`Hotkey Error: ${err}`));
        });
        if (successOnAction.length === 1 && successOnAction[0] === true) {
          resolve(true);
        }
        this.hotkey.stdout.on('data', data => {
          if (!data) {
            console.log('Empty?');
            return;
          }
          const strings = data.toString().split(/\r?\n/);
          for (const string of strings) {
            if (!string) {
              continue;
            }
            const stdout = JSON.parse(string);
            // console.log(stdout);

            const result = DolphinResponse.ahkResponse(stdout);

            this.emit('ahkEvent', result);
            // console.log(result);
            if (DolphinActions.isCallable(result.action)) {
              const callResult = DolphinActions.call(
                result.action,
                build,
                result.value
              );
	            if (successOnAction.includes(result.action)) {
		            resolve(callResult);
	            }
            }
	          if (successOnAction.includes(result.action)) {
		          resolve(result);
	          }
	          if (failOnActions.includes(result.action)) {
		          reject(result.value);
	          }
          }
        });
        this.hotkey.on('exit', () => {
          this.hotkey = null;
          reject(new Error('Closed Before Completing Requested Action'));
        });
      });
    });
  }

  async killHotkey() {
    if (this.hotkey) {
      return new Promise(resolve => {
        console.log('waiting for hotkey to exit');
        this.hotkey.on('exit', ()=>{
          this.hotkey = null;
          resolve();
        });
        this.hotkey.on('close', ()=>{
          this.hotkey = null;
          resolve();
        });
        this.hotkey.kill();
      });
    }
    return Promise.resolve(true);
  }

  async startGame() {
    console.log('command to start game');
    return this.launchHotKey(
      'launch',
      null,
      'start_game_success',
      'start_game_error'
    );
  }

  async launch(build: Build) {
    if (!build) {
      throw new Error('Build is required!');
    }
    return this.killHotkey().then(()=>this.buildLauncher
      .launch(build, null, true))
      .then(dolphinProcess => {
        if (dolphinProcess) {
          dolphinProcess.on('exit', () => {
            this.killHotkey().catch(error => {
              console.error(error);
            });
          });
        }
        const parameters = ['launch'];
        parameters.push('Temp Username');
        parameters.push(build.name);
        return Promise.all([
          dolphinProcess,
          this.launchHotKey(parameters, build, [true])
        ]);
      })
      .catch(error => {
        throw error;
      });
  }

  async close() {
    return this.buildLauncher.close();
  }

  async host(build: Build, gameLaunch) {
    if (!gameLaunch) {
      throw new Error('A Game is Required to host!');
    }
    const dolphinPromise = this.killHotkey().then(()=>this.buildLauncher
      .launch(build, null, true))
      .then(dolphinProcess => {
        build.addLaunch();
        if (dolphinProcess) {
          dolphinProcess.on('exit', () => {
            this.killHotkey();
          });
        }
        return dolphinProcess;
      });
    const hotkeyPromise = dolphinPromise.then(() => {
      const parameters = ['host'];
      parameters.push('Username');
      if (gameLaunch) {
        if (gameLaunch.id) {
          build.addGameLaunch(gameLaunch.id);
        }
        parameters.push(gameLaunch.dolphin_game_id_hint);
        parameters.push(gameLaunch.name);
        parameters.push(build.name);
      }
      return this.launchHotKey(parameters, build, 'host_code', [
        'setup_netplay_host_failed',
        'setup_netplay_host_failed_empty_list'
      ]);
    });
    return Promise.all([dolphinPromise, hotkeyPromise]);
  }

  async join(build, hostCode) {
    if (!hostCode) {
      throw new Error('IP Address or Host code is required to join!');
    }
    return this.killHotkey().then(()=>this.buildLauncher
      .launch(build, null, true))
      .then(dolphinProcess => {
        if (!dolphinProcess) {
          throw new Error('Dolphin already open!');
        }
        dolphinProcess.on('exit', () => {
            this.killHotkey();
        });
        return new Promise((resolve, reject) => {
          const parameters = ['join'];
          parameters.push('Username');
          parameters.push(hostCode);
          parameters.push(build.name);
          this.launchHotKey(parameters, build, ['lobby_join', 'player_list_info'])
            .then(() => {
              resolve();
            })
            .catch(error => {
              reject(error);
            });
        });
      })
      .then(() => {
        console.log('resolved?');
      });
  }
}
