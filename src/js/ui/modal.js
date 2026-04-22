function qs(selector, parent = document) {
    return parent.querySelector(selector);
}

function qsa(selector, parent = document) {
    return [...parent.querySelectorAll(selector)];
}

function setOpen(modal, open) {
    if (!modal) return;
    modal.dataset.open = open ? 'true' : 'false';
    modal.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) {
        const dialog = modal.querySelector('[role="dialog"]');
        if (dialog instanceof HTMLElement) {
            dialog.focus({ preventScroll: true });
        }
    }
}

export function initModals() {
    document.addEventListener('click', (e) => {
        const target = /** @type {HTMLElement} */ (e.target);

        const openBtn = target.closest('[data-al-modal-open]');
        if (openBtn) {
            const id = openBtn.getAttribute('data-al-modal-open');
            if (!id) return;
            const modal = qs(`#${CSS.escape(id)}`);
            setOpen(modal, true);
            return;
        }

        const closeBtn = target.closest('[data-al-modal-close]');
        if (closeBtn) {
            const id = closeBtn.getAttribute('data-al-modal-close');
            const modal = id ? qs(`#${CSS.escape(id)}`) : closeBtn.closest('[data-al-modal-backdrop]');
            setOpen(modal, false);
            return;
        }

        const backdrop = target.closest('[data-al-modal-backdrop]');
        if (backdrop && target === backdrop) {
            setOpen(backdrop, false);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        qsa('[data-al-modal-backdrop][data-open="true"]').forEach((modal) => {
            setOpen(modal, false);
        });
    });
}
