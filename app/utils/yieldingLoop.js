export default function yieldingLoop(count, chunksize, callback, cancelToken = {}) {
	let i = 0;
	let totalSkipped = 0;
	return new Promise((resolve, reject) => {
		(function chunk() {
			const end = Math.min(i + chunksize, count);
			let skipTimeout = false;
			for (; i < end; ++i) {
				skipTimeout = callback.call(null, i);
			}
			if (cancelToken.cancelled) {
				reject();
				return;
			}
			if (i < count) {
				if (skipTimeout === true) {
					totalSkipped++;
					chunk.call(null);
				} else {
					setTimeout(chunk, 0);
				}
			} else {
				resolve(totalSkipped);
			}
		})();
	});
}