/* eslint-disable no-bitwise */
import slugify from 'slugify';

export default class StringManipulator {
	static slugify(str) {
		str = str.replace(/[~`!@#$%^&*(){}\[\];:"'<,.>?\/\\|_+=-]/g, '-');
		if (str.charAt(str.length - 1) === '-') {
			str = str.substring(0, str.length - 1);
		}
		return slugify(str.toLowerCase());
	}

	static getFileExtension(path) {
		const basename = path.split(/[\\/]/).pop();
		// extract file name from full path ...
		// (supports `\\` and `/` separators)

		const pos = basename.lastIndexOf('.');       // get last position of `.`

		if (basename === '' || pos < 1)            // if file name is empty or ...
		{
			return '';
		}                             //  `.` not found (-1) or comes first (0)

		return basename.slice(pos + 1);            // extract extension ignoring `.`
	}

	static timeFormat(seconds) {
		// Hours, minutes and seconds
		const hrs = ~~(seconds / 3600);
		const mins = ~~((seconds % 3600) / 60);
		const secs = seconds % 60;

		// Output like "1:01" or "4:03:59" or "123:03:59"
		let ret = '';

		if (hrs > 0) {
			ret += `${  hrs  }:${  mins < 10 ? '0' : ''}`;
		}

		ret += `${  mins  }:${  secs < 10 ? '0' : ''}`;
		ret += `${  secs}`;
		return ret;
	}

	static humanFileSize(bytes, si) {
		const thresh = si ? 1000 : 1024;
		if (Math.abs(bytes) < thresh) {
			return `${bytes  } B`;
		}
		const units = si
			? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
			: ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
		let u = -1;
		do {
			bytes /= thresh;
			++u;
		} while (Math.abs(bytes) >= thresh && u < units.length - 1);
		return `${bytes.toFixed(1)  } ${  units[u]}`;
	}
}