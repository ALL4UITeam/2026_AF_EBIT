/**
 * @param {ParentNode} root
 */
export function initToggle(root) {
    root.addEventListener('click', (e) => {
        const target = /** @type {HTMLElement} */ (e.target);
        const sw = target.closest('[data-al-toggle]');
        if (!sw || !root.contains(sw)) return;
        if (sw.getAttribute('role') !== 'switch') return;

        const pressed = sw.getAttribute('aria-checked') === 'true';
        const next = !pressed;
        sw.setAttribute('aria-checked', next ? 'true' : 'false');
    });
}
