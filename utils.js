// @ts-check

/**
 * Shuffle an array.
 *
 * Makes a shallow copy
 * @param {any[]} a
 */
export function shuffle(a) {
	const arr = a.slice();
	let m = arr.length;
	while (m) {
		const i = Math.floor(Math.random() * m);
		m--;
		const t = arr[m];
		arr[m] = arr[i];
		arr[i] = t;
	}
	return arr;
}
