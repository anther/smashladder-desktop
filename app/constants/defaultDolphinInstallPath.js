import { remote } from 'electron';
import path from 'path';

const defaultDolphinInstallPath = path.join(remote.app.getPath('userData'), 'dolphin_downloads');
export default defaultDolphinInstallPath;