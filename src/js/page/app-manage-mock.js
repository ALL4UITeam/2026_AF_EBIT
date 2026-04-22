import { initPagination } from '../ui/pagination.js';

function initAppManageMock() {
    const root = document.getElementById('alContent');
    if (!root) return;

    const model = { currentPage: 1, totalPages: 99 };

    const { render } = initPagination(
        root,
        () => ({ currentPage: model.currentPage, totalPages: model.totalPages }),
        (page) => {
            model.currentPage = page;
            render();
        }
    );

    render();
}

initAppManageMock();

