const APK_PATTERN = /\.apk$/i;
const DEFAULT_MAX_BYTES = 500 * 1024 * 1024;

function formatSize(size) {
    if (!Number.isFinite(size) || size < 0) return '0B';
    if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)}MB`;
    if (size >= 1024) return `${Math.ceil(size / 1024)}KB`;
    return `${size}B`;
}

export function makeFileId(file) {
    return `${file.name}__${file.size}__${file.lastModified}`;
}

/**
 * @param {Object} options
 * @param {ParentNode} options.root
 * @param {(files: File[]) => void} options.onValidFiles - 검증 통과 파일(누적 추가는 상위에서 처리)
 * @param {number} [options.maxBytes]
 */
export function initFileUpload({ root, onValidFiles, maxBytes = DEFAULT_MAX_BYTES }) {
    const scope = root.querySelector('[data-al-file-upload]');
    if (!scope) return;

    const input = scope.querySelector('[data-al-file-input]');
    const pickBtn = scope.querySelector('[data-al-file-pick]');
    const dropzone = scope.querySelector('[data-al-file-dropzone]');
    const message = scope.querySelector('[data-al-file-message]');

    /** @param {string[]} errors */
    const showErrors = (errors) => {
        if (!message) return;
        message.replaceChildren();

        if (!errors.length) {
            message.setAttribute('hidden', '');
            message.removeAttribute('role');
            return;
        }

        const ul = document.createElement('ul');
        ul.className = 'al-file-upload__message-list';
        errors.forEach((line) => {
            const li = document.createElement('li');
            li.textContent = line;
            ul.appendChild(li);
        });
        message.appendChild(ul);
        message.removeAttribute('hidden');
        message.setAttribute('role', 'alert');
    };

    const validate = (files) => {
        /** @type {File[]} */
        const valids = [];
        /** @type {string[]} */
        const errors = [];

        for (const file of files) {
            if (!APK_PATTERN.test(file.name)) {
                errors.push(`${file.name} — 확장자는 APK(.apk)만 허용됩니다.`);
                continue;
            }
            if (file.size > maxBytes) {
                errors.push(`${file.name} — 파일당 최대 500MB까지 허용됩니다.`);
                continue;
            }
            valids.push(file);
        }

        return { valids, errors };
    };

    const handleFiles = (fileList) => {
        const list = [...fileList];
        if (!list.length) return;

        const { valids, errors } = validate(list);
        if (errors.length) {
            showErrors(errors);
        } else {
            showErrors([]);
        }

        if (valids.length) {
            onValidFiles(valids);
        }

        if (input) {
            input.value = '';
        }
    };

    pickBtn?.addEventListener('click', () => {
        showErrors([]);
        input?.click();
    });

    input?.addEventListener('change', (e) => {
        const target = /** @type {HTMLInputElement} */ (e.target);
        handleFiles(target.files || []);
    });

    dropzone?.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('al-file-upload__dropzone--active');
    });

    dropzone?.addEventListener('dragleave', () => {
        dropzone.classList.remove('al-file-upload__dropzone--active');
    });

    dropzone?.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('al-file-upload__dropzone--active');
        handleFiles(e.dataTransfer?.files || []);
    });
}

/**
 * @param {ParentNode} root
 * @param {Array<{ id: string, file: File }>} pageFiles
 * @param {(action: 'download'|'remove', fileId: string) => void} dispatch
 */
export function renderFileList(root, pageFiles, dispatch) {
    const list = root.querySelector('[data-al-file-list]');
    if (!list) return;

    list.innerHTML = '';

    if (!pageFiles.length) {
        const empty = document.createElement('li');
        empty.className = 'al-file-upload__item al-file-upload__item--empty';
        empty.textContent = '파일이 없습니다.';
        list.appendChild(empty);
        return;
    }

    pageFiles.forEach(({ id, file }) => {
        const li = document.createElement('li');
        li.className = 'al-file-upload__item';
        li.dataset.alFileId = id;

        const name = document.createElement('span');
        name.className = 'al-file-upload__name';
        name.textContent = `${file.name} [${formatSize(file.size)}]`;

        const actions = document.createElement('div');
        actions.className = 'al-file-upload__item-actions';

        const dlBtn = document.createElement('button');
        dlBtn.type = 'button';
        dlBtn.className = 'al-file-upload__btn';
        dlBtn.dataset.action = 'download';
        dlBtn.textContent = '다운로드';

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'al-file-upload__btn al-file-upload__btn--danger';
        delBtn.dataset.action = 'remove';
        delBtn.textContent = '삭제';

        actions.append(dlBtn, delBtn);
        li.append(name, actions);
        list.appendChild(li);
    });

    list.onclick = (e) => {
        const btn = /** @type {HTMLElement} */ (e.target).closest('button[data-action]');
        if (!btn) return;
        const item = /** @type {HTMLElement} */ (e.target).closest('[data-al-file-id]');
        const fileId = item?.dataset.alFileId;
        if (!fileId) return;
        const { action } = btn.dataset;
        if (action === 'download' || action === 'remove') {
            dispatch(action, fileId);
        }
    };
}

export { formatSize };
