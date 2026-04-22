import '../../scss/main.scss';

import { initFileUpload, renderFileList, makeFileId } from '../ui/fileUpload.js';
import { initModals } from '../ui/modal.js';
import { initTabs } from '../ui/tabs.js';
import { initToggle } from '../ui/toggle.js';
import { initPagination } from '../ui/pagination.js';
import { initSidenav } from '../ui/sidenav.js';

/**
 * @typedef {{ id: string, file: File }} GuideFileRow
 */

function initGuidePage() {
    const root = document.getElementById('alContent');
    if (!root) return;

    /** @type {{ files: GuideFileRow[], filteredFiles: GuideFileRow[], currentPage: number, pageSize: number }} */
    const model = {
        files: [],
        filteredFiles: [],
        currentPage: 1,
        pageSize: 5,
    };

    const { render: renderPagination } = initPagination(
        root,
        () => ({
            currentPage: model.currentPage,
            totalPages: Math.max(1, Math.ceil(model.filteredFiles.length / model.pageSize)),
        }),
        (page) => {
            const totalPages = Math.max(1, Math.ceil(model.filteredFiles.length / model.pageSize));
            model.currentPage = Math.min(Math.max(1, page), totalPages);
            refreshListView();
        }
    );

    function handleDownload(fileId) {
        const target = model.files.find((item) => item.id === fileId);
        if (!target) return;

        const url = URL.createObjectURL(target.file);
        const a = document.createElement('a');
        a.href = url;
        a.download = target.file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    function handleRemove(fileId) {
        model.files = model.files.filter((item) => item.id !== fileId);
        applyFilter();
    }

    function refreshListView() {
        const totalPages = Math.max(1, Math.ceil(model.filteredFiles.length / model.pageSize));
        if (model.currentPage > totalPages) {
            model.currentPage = totalPages;
        }

        const start = (model.currentPage - 1) * model.pageSize;
        const pageSlice = model.filteredFiles.slice(start, start + model.pageSize);

        renderFileList(root, pageSlice, (action, fileId) => {
            if (action === 'download') handleDownload(fileId);
            if (action === 'remove') handleRemove(fileId);
        });

        renderPagination();
    }

    function applyFilter() {
        const kw = root.querySelector('[data-al-guide-kw]');
        const keyword = (kw instanceof HTMLInputElement ? kw.value : '').trim().toLowerCase();

        model.filteredFiles = keyword
            ? model.files.filter(({ file }) => file.name.toLowerCase().includes(keyword))
            : [...model.files];

        const tot = root.querySelector('[data-al-total-count]');
        if (tot) tot.textContent = String(model.filteredFiles.length);

        model.currentPage = 1;
        refreshListView();
    }

    function appendValidFiles(/** @type {File[]} */ newFiles) {
        newFiles.forEach((file) => {
            const id = makeFileId(file);
            if (!model.files.some((row) => row.id === id)) {
                model.files.push({ id, file });
            }
        });
        applyFilter();
    }

    initFileUpload({ root, onValidFiles: appendValidFiles });
    initModals();
    initTabs(root);
    initToggle(root);

    const searchBtn = root.querySelector('[data-al-guide-search]');
    const kw = root.querySelector('[data-al-guide-kw]');

    const runSearch = () => applyFilter();
    searchBtn?.addEventListener('click', runSearch);
    kw?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') runSearch();
    });

    applyFilter();
}

document.addEventListener('DOMContentLoaded', () => {
    initSidenav();
});

initGuidePage();
