const MQ_TABLET = window.matchMedia('(max-width: 1279px)');

export function initNavAccordion() {
    const triggers = document.querySelectorAll('.al-sidenav__trigger');

    triggers.forEach((btn) => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.al-sidenav__item');
            if (!item) return;

            const wasOpen = item.classList.contains('is-open');

            document.querySelectorAll('.al-sidenav__item.is-open').forEach((el) => {
                el.classList.remove('is-open');
                const b = el.querySelector('.al-sidenav__trigger');
                if (b) b.setAttribute('aria-expanded', 'false');
            });

            if (!wasOpen) {
                item.classList.add('is-open');
                btn.setAttribute('aria-expanded', 'true');
            }
        });
    });
}

export function initDrawer() {
    const sidenav = document.getElementById('alSidenav');
    const backdrop = document.getElementById('alBackdrop');
    const menuBtn = document.getElementById('alMenuBtn');
    if (!sidenav || !backdrop || !menuBtn) return;

    function open() {
        sidenav.classList.add('is-open');
        backdrop.classList.add('is-visible');
        document.body.classList.add('al-drawer-open');
        menuBtn.setAttribute('aria-expanded', 'true');
    }

    function close() {
        sidenav.classList.remove('is-open');
        backdrop.classList.remove('is-visible');
        document.body.classList.remove('al-drawer-open');
        menuBtn.setAttribute('aria-expanded', 'false');
    }

    menuBtn.addEventListener('click', () => {
        if (!MQ_TABLET.matches) return;
        sidenav.classList.contains('is-open') ? close() : open();
    });

    backdrop.addEventListener('click', close);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && MQ_TABLET.matches && sidenav.classList.contains('is-open')) {
            close();
        }
    });

    function sync() {
        if (!MQ_TABLET.matches) close();
    }

    MQ_TABLET.addEventListener('change', sync);
    sync();
}

export function initSidenav() {
    initNavAccordion();
    initDrawer();
}
