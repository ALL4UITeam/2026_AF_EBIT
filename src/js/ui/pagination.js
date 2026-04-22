/**
 * @param {number} current
 * @param {number} total
 * @returns {(number | 'ellipsis')[]}
 */
export function buildPageItems(current, total) {
    if (total <= 1) return [1];

    const delta = 2;
    /** @type {number[]} */
    const range = [];

    for (let i = 1; i <= total; i += 1) {
        if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
            range.push(i);
        }
    }

    /** @type {(number | 'ellipsis')[]} */
    const out = [];
    let l = 0;

    for (const i of range) {
        if (l) {
            if (i - l === 2) out.push(l + 1);
            else if (i - l !== 1) out.push('ellipsis');
        }
        out.push(i);
        l = i;
    }

    return out;
}

/**
 * @param {ParentNode} root
 * @param {() => { currentPage: number, totalPages: number }} getModel
 * @param {(page: number) => void} onPageChange
 */
export function initPagination(root, getModel, onPageChange) {
    const nav = root.querySelector('[data-al-pagination]');
    if (!nav) {
        return { render: () => {} };
    }

    const pagesEl = nav.querySelector('[data-al-pagination-pages]');
    const firstBtn = nav.querySelector('[data-al-page-first]');
    const prevBtn = nav.querySelector('[data-al-page-prev]');
    const nextBtn = nav.querySelector('[data-al-page-next]');
    const lastBtn = nav.querySelector('[data-al-page-last]');

    const render = () => {
        const { currentPage, totalPages } = getModel();

        if (firstBtn) firstBtn.disabled = currentPage <= 1 || totalPages <= 1;
        if (prevBtn) prevBtn.disabled = currentPage <= 1 || totalPages <= 1;
        if (nextBtn) nextBtn.disabled = currentPage >= totalPages || totalPages <= 1;
        if (lastBtn) lastBtn.disabled = currentPage >= totalPages || totalPages <= 1;

        if (!pagesEl) return;
        pagesEl.innerHTML = '';

        const items = buildPageItems(currentPage, totalPages);

        items.forEach((item) => {
            if (item === 'ellipsis') {
                const span = document.createElement('span');
                span.className = 'al-pagination__ellipsis';
                span.setAttribute('aria-hidden', 'true');
                span.textContent = '···';
                pagesEl.appendChild(span);
                return;
            }

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'al-pagination__page';
            btn.dataset.alPageNum = String(item);
            btn.textContent = String(item);
            if (item === currentPage) {
                btn.classList.add('al-pagination__page--active');
                btn.setAttribute('aria-current', 'page');
            }
            pagesEl.appendChild(btn);
        });
    };

    nav.addEventListener('click', (e) => {
        const target = /** @type {HTMLElement} */ (e.target);
        const { currentPage, totalPages } = getModel();

        const pageBtn = target.closest('[data-al-page-num]');
        if (pageBtn) {
            const page = Number(pageBtn.getAttribute('data-al-page-num'));
            if (!Number.isFinite(page)) return;
            onPageChange(page);
            return;
        }

        if (target.closest('[data-al-page-first]')) {
            onPageChange(1);
            return;
        }

        if (target.closest('[data-al-page-prev]')) {
            onPageChange(Math.max(1, currentPage - 1));
            return;
        }

        if (target.closest('[data-al-page-next]')) {
            onPageChange(Math.min(totalPages, currentPage + 1));
            return;
        }

        if (target.closest('[data-al-page-last]')) {
            onPageChange(totalPages);
        }
    });

    return { render };
}
