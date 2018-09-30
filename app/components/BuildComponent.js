import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { clipboard } from 'electron';
import path from 'path';
import _ from 'lodash';
import unzipper from 'unzipper';
import Build from '../utils/BuildData';
import Files from '../utils/Files';

import multitry from '../utils/multitry';

import Button from './elements/Button';
import Select from './elements/Select';
import ProgressIndeterminate from './elements/ProgressIndeterminate';
import ProgressDeterminate from './elements/ProgressDeterminate';

const fs = require('fs');
const request = require('request');
const progress = require('request-progress');

export default class BuildComponent extends Component {
  static propTypes = {
    build: PropTypes.instanceOf(Build).isRequired,
    setBuildPath: PropTypes.func.isRequired,
    closeDolphin: PropTypes.func.isRequired,
    joinBuild: PropTypes.func.isRequired,
    launchBuild: PropTypes.func.isRequired,
    hostBuild: PropTypes.func.isRequired,
    startGame: PropTypes.func.isRequired,
    buildOpen: PropTypes.bool.isRequired,
    buildOpening: PropTypes.bool.isRequired,
    buildError: PropTypes.any,
    hostCode: PropTypes.string.isRequired
  };

  static defaultProps = {
    buildError: null
  };

  constructor(props) {
    super(props);
    const { build } = this.props;

    const selectedGame = build.getPrimaryGame();

    this.state = {
      error: null,
      selectedGame: selectedGame ? selectedGame.id : null,
      joinCode: '',
      enterJoinCode: false,

      downloading: null,
      downloadingProgress: null,
      downloadError: null
    };

    this.onSetBuildPathClick = this.setBuildPathClick.bind(this);
    this.onUnsetBuildPathClick = this.unsetBuildPathClick.bind(this);

    this.onHostClick = this.hostClick.bind(this);
    this.onCloseClick = this.closeClick.bind(this);
    this.onJoinClick = this.joinClick.bind(this);
    this.onLaunchClick = this.launchClick.bind(this);
    this.onStartGameClick = this.startGameClick.bind(this);

    this.onJoinCodeChange = this.joinCodeChange.bind(this);
    this.onJoinKeyPress = this.joinKeyPress.bind(this);
    this.onJoinCodeSubmit = this.joinCodeSubmit.bind(this);
    this.onJoinCodeCancel = this.joinCodeCancel.bind(this);
    this.onDownloadClick = this.downloadClick.bind(this);

    this.onSelectedGameChange = this.selectedGameChange.bind(this);
  }

  setBuildPathClick() {
    const { build } = this.props;
    this.setState({
      settingBuildPath: true
    });

    return Files.selectFile(build.executableDirectory(), 'Select your Dolphin Executable')
      .then(selectedPath => {
        if (selectedPath) {
          this.props.setBuildPath(build, selectedPath);
        }
        this.setState({
          settingBuildPath: false
        });
      })
      .catch(error => console.error(error));
  }

  unsetBuildPathClick() {
    this.props.setBuildPath(this.props.build, null);
  }

  downloadClick() {
    this.setState({
      downloading: 'Downloading...',
      downloadError: null,
      error: null
    });

    const { build } = this.props;

    const basePath = Files.createApplicationPath('./dolphin_downloads');

    const baseName = `${Files.makeFilenameSafe(build.name + build.id)}`;
    const extension = path.extname(build.download_file);
    const baseNameAndExtension = `${baseName}${extension}`;
    const unzipLocation = path.join(basePath, baseName, '/');
    const zipWriteLocation = path.join(basePath, baseNameAndExtension);

    console.log('basepath', basePath);
    console.log('unzipLocation', unzipLocation);
    console.log('zipWriteLocation', zipWriteLocation);

    Files.ensureDirectoryExists(basePath, 0o0755)
      .then(() => {
        this.setState({
            downloading: build.download_file
        });
        return progress(request(build.download_file), {})
          .on('progress', state => {
            this.setState({
              downloadingProgress: state.percent
            });
            console.log('progress', state);
          })
          .on('error', err => {
            console.error(err);
            this.setState({
              downloadError: err,
              downloading: null
            });
          })
          .once('finish', () => {
            console.log('finished!');
          })
          .on('end', () => {
            console.log('ended!');
            // Do something after request finishes
            this.setState({
              downloading: 'Unzipping Build',
              downloadingProgress: null
            });

            const updateUnzipDisplay = _.throttle(entry => {
              this.setState({
                unzipStatus: entry.path ? entry.path : null
              });
            }, 100);
            switch (extension.toLowerCase()) {
              case '.zip':
                console.log('Before open zip', zipWriteLocation);
                multitry(500, 5, () => {
                  fs.createReadStream(zipWriteLocation).pipe(
                    unzipper
                      .Extract({ path: unzipLocation })
                      .on('close', () => {
                        const dolphinLocation = Files.findInDirectory(
                          unzipLocation,
                          'Dolphin.exe'
                        );
                        if (dolphinLocation.length) {
                          this.props.setBuildPath(
                            build,
                            dolphinLocation[0],
                            true
                          );
                        }
                        this.setState({
                          downloading: null,
                          unzipStatus: null
                        });
                      })
                      .on('entry', updateUnzipDisplay)
                      .on('error', error => {
                        this.setState({
                          downloading: null,
                          unzipStatus: null,
                          error: error.toString()
                        });
                      })
                  );
                });

                break;
              default:
                this.setState({
                  unzipStatus: null,
                  downloading: null,
                  error: 'Could not extract archive! (Invalid Extension)'
                });
            }
          })
          .pipe(fs.createWriteStream(zipWriteLocation));
      })
      .catch(error => {
        this.setState({
          error: error ? error.toString() : 'Error Downloading File...'
        });
      });
  }

  joinKeyPress(event) {
    if (event.key === 'Enter') {
      event.stopPropagation();
      this.joinCodeSubmit();
    }
  }

  joinCodeCancel() {
    this.setState({
      enterJoinCode: false,
      joinCode: ''
    });
  }

  joinCodeChange(event) {
    this.setState({
      joinCode: event.target.value
    });
  }

  joinClick() {
    this.setState({
      enterJoinCode: true,
      joinCode: clipboard.readText()
    });
  }

  selectedGameChange(event) {
    this.setState({
      selectedGame: event.target.value
    });
  }

  closeClick() {
    return this.props.closeDolphin();
  }

  _getSelectedGame() {
    const game = this.props.build.getPossibleGames().find(searchGame => {
      return searchGame.id === this.state.selectedGame;
    });
    if (!game) {
      this.setState({
        error: 'Somehow No Game Is Selected'
      });
      return null;
    }
    return game;
  }

  joinCodeSubmit() {
    this.props.joinBuild(this.props.build, this.state.joinCode);
  }

  launchClick() {
    return this.props.launchBuild(this.props.build);
  }

  hostClick() {
    this.props.hostBuild(this.props.build, this._getSelectedGame());
  }

  startGameClick() {
    this.props.startGame(this.props.build);
  }

  render() {
    const { build, buildOpen, buildOpening, hostCode, buildError } = this.props;
    const { settingBuildPath } = this.state;

    const error = this.state.error || buildError;
    return (
      <div className="build" key={build.id}>
        <div className="build_heading">
          <div className="path_button">
            {build.path && (
              <span className="has_path">
                <Button
                  disabled={settingBuildPath}
                  title={build.path}
                  onClick={this.onSetBuildPathClick}
                  onContextMenu={this.onUnsetBuildPathClick}
                  className="btn-small set"
                >
                  Path Set
                </Button>
              </span>
            )}
            {!build.path && (
              <span className="no_path">
                <Button
                  disabled={settingBuildPath}
                  onClick={this.onSetBuildPathClick}
                  className="btn-small not_set"
                >
                  Path Not Set
                </Button>
              </span>
            )}
          </div>

          <span className="build_name">{build.name}</span>
        </div>

        {!this.state.enterJoinCode && (
          <div className="build_actions">
            {build.path && (
              <React.Fragment>
                <div className="dolphin_actions">
                  {!buildOpen && (
                    <React.Fragment>
                      <Button onClick={this.onLaunchClick}>Launch</Button>
                      <Button onClick={this.onHostClick}>Host</Button>
                      <Button onClick={this.onJoinClick}>Join</Button>
                    </React.Fragment>
                  )}
                  {buildOpen && (
                    <React.Fragment>
                      <Button onClick={this.onCloseClick}>Close</Button>
                      {hostCode && (
                        <Button onClick={this.onStartGameClick}>
                          Start Game
                        </Button>
                      )}
                    </React.Fragment>
                  )}
                </div>
                {buildOpen &&
                  hostCode && <h6 className="host_code">{hostCode}</h6>}
                {!buildOpen && (
                  <div className="select_game_container">
                    <Select
                      className="select_game"
                      onChange={this.onSelectedGameChange}
                      value={this.state.selectedGame}
                    >
                      {build.getPossibleGames().map(game => (
                        <option value={game.id} key={game.id}>
                          {game.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
              </React.Fragment>
            )}
            {!build.path &&
              build.hasDownload() && (
                <React.Fragment>
                  {!this.state.downloading && (
                    <Button
                      className="download_build"
                      onClick={this.onDownloadClick}
                    >
                      Download <span className="download_arrow">⇩</span>
                    </Button>
                  )}
                  {this.state.downloading && (
                    <React.Fragment>
                      <span className="downloading_status">
                        <div>
                          <span className="text">
                            {this.state.downloading}{' '}
                          </span>
                          {this.state.downloadingProgress && (
                            <span className="percent">
                              {Math.floor(this.state.downloadingProgress * 100)}
                              %
                            </span>
                          )}
                        </div>
                        <div className="nowrap">{this.state.unzipStatus}</div>
                      </span>
                      {this.state.downloadingProgress && (
                        <ProgressDeterminate
                          percent={this.state.downloadingProgress * 100}
                        />
                      )}
                      {!this.state.downloadingProgress && (
                        <ProgressIndeterminate />
                      )}
                    </React.Fragment>
                  )}
                </React.Fragment>
              )}
          </div>
        )}

        {this.state.enterJoinCode && (
          <div className="enter_join_code dolphin_actions">
            <input
              className="join_code_input"
              placeholder="Host Code Goes Here"
              type="text"
              value={this.state.joinCode}
              onChange={this.onJoinCodeChange}
              onKeyPress={this.onJoinKeyPress}
            />
            <Button onClick={this.onJoinCodeSubmit}>Go!</Button>
            <Button className="cancel" onClick={this.onJoinCodeCancel}>
              Cancel
            </Button>
          </div>
        )}

        <div>
          {buildOpening && <ProgressIndeterminate />}
          {buildOpen && !buildOpening && <ProgressDeterminate />}
          {error && <div className="error">{error}</div>}
        </div>
      </div>
    );
  }
}
