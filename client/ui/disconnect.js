import Dom from '../dom.js';

let disconn = false;

/**
 * @param {HTMLElement} dom
 */
export default function disconnect(dom) {
	if (disconn) { return; }
	disconn = true;
	const d = document.createElement('div');
	d.classList.add('disconnect');

	d.appendChild(Dom.h1('Disconnected 😞'));
	d.appendChild(Dom.p('Someone disconnected from the game.'));
	d.appendChild(Dom.button('Restart', () => {
		// eslint-disable-next-line no-restricted-globals
		location.reload();
	}));

	dom.appendChild(d);
	if (!getComputedStyle(d).transform) {
		// eslint-disable-next-line no-console
		console.debug('Whatever');
	}
	d.style.transform = 'translateX(0)';
}
