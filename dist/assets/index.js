(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const APK_PATTERN = /\.apk$/i;
const DEFAULT_MAX_BYTES = 500 * 1024 * 1024;
function formatSize(size) {
  if (!Number.isFinite(size) || size < 0) return "0B";
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)}MB`;
  if (size >= 1024) return `${Math.ceil(size / 1024)}KB`;
  return `${size}B`;
}
function makeFileId(file) {
  return `${file.name}__${file.size}__${file.lastModified}`;
}
function initFileUpload({ root, onValidFiles, maxBytes = DEFAULT_MAX_BYTES }) {
  const scope = root.querySelector("[data-al-file-upload]");
  if (!scope) return;
  const input = scope.querySelector("[data-al-file-input]");
  const pickBtn = scope.querySelector("[data-al-file-pick]");
  const dropzone = scope.querySelector("[data-al-file-dropzone]");
  const message = scope.querySelector("[data-al-file-message]");
  const showErrors = (errors) => {
    if (!message) return;
    message.replaceChildren();
    if (!errors.length) {
      message.setAttribute("hidden", "");
      message.removeAttribute("role");
      return;
    }
    const ul = document.createElement("ul");
    ul.className = "al-file-upload__message-list";
    errors.forEach((line) => {
      const li = document.createElement("li");
      li.textContent = line;
      ul.appendChild(li);
    });
    message.appendChild(ul);
    message.removeAttribute("hidden");
    message.setAttribute("role", "alert");
  };
  const validate = (files) => {
    const valids = [];
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
      input.value = "";
    }
  };
  pickBtn == null ? void 0 : pickBtn.addEventListener("click", () => {
    showErrors([]);
    input == null ? void 0 : input.click();
  });
  input == null ? void 0 : input.addEventListener("change", (e) => {
    const target = (
      /** @type {HTMLInputElement} */
      e.target
    );
    handleFiles(target.files || []);
  });
  dropzone == null ? void 0 : dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("al-file-upload__dropzone--active");
  });
  dropzone == null ? void 0 : dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("al-file-upload__dropzone--active");
  });
  dropzone == null ? void 0 : dropzone.addEventListener("drop", (e) => {
    var _a;
    e.preventDefault();
    dropzone.classList.remove("al-file-upload__dropzone--active");
    handleFiles(((_a = e.dataTransfer) == null ? void 0 : _a.files) || []);
  });
}
function renderFileList(root, pageFiles, dispatch) {
  const list = root.querySelector("[data-al-file-list]");
  if (!list) return;
  list.innerHTML = "";
  if (!pageFiles.length) {
    const empty = document.createElement("li");
    empty.className = "al-file-upload__item al-file-upload__item--empty";
    empty.textContent = "파일이 없습니다.";
    list.appendChild(empty);
    return;
  }
  pageFiles.forEach(({ id, file }) => {
    const li = document.createElement("li");
    li.className = "al-file-upload__item";
    li.dataset.alFileId = id;
    const name = document.createElement("span");
    name.className = "al-file-upload__name";
    name.textContent = `${file.name} [${formatSize(file.size)}]`;
    const actions = document.createElement("div");
    actions.className = "al-file-upload__item-actions";
    const dlBtn = document.createElement("button");
    dlBtn.type = "button";
    dlBtn.className = "al-file-upload__btn";
    dlBtn.dataset.action = "download";
    dlBtn.textContent = "다운로드";
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "al-file-upload__btn al-file-upload__btn--danger";
    delBtn.dataset.action = "remove";
    delBtn.textContent = "삭제";
    actions.append(dlBtn, delBtn);
    li.append(name, actions);
    list.appendChild(li);
  });
  list.onclick = (e) => {
    const btn = (
      /** @type {HTMLElement} */
      e.target.closest("button[data-action]")
    );
    if (!btn) return;
    const item = (
      /** @type {HTMLElement} */
      e.target.closest("[data-al-file-id]")
    );
    const fileId = item == null ? void 0 : item.dataset.alFileId;
    if (!fileId) return;
    const { action } = btn.dataset;
    if (action === "download" || action === "remove") {
      dispatch(action, fileId);
    }
  };
}
function qs(selector, parent = document) {
  return parent.querySelector(selector);
}
function qsa(selector, parent = document) {
  return [...parent.querySelectorAll(selector)];
}
function setOpen(modal, open) {
  if (!modal) return;
  modal.dataset.open = open ? "true" : "false";
  modal.setAttribute("aria-hidden", open ? "false" : "true");
  if (open) {
    const dialog = modal.querySelector('[role="dialog"]');
    if (dialog instanceof HTMLElement) {
      dialog.focus({ preventScroll: true });
    }
  }
}
function initModals() {
  document.addEventListener("click", (e) => {
    const target = (
      /** @type {HTMLElement} */
      e.target
    );
    const openBtn = target.closest("[data-al-modal-open]");
    if (openBtn) {
      const id = openBtn.getAttribute("data-al-modal-open");
      if (!id) return;
      const modal = qs(`#${CSS.escape(id)}`);
      setOpen(modal, true);
      return;
    }
    const closeBtn = target.closest("[data-al-modal-close]");
    if (closeBtn) {
      const id = closeBtn.getAttribute("data-al-modal-close");
      const modal = id ? qs(`#${CSS.escape(id)}`) : closeBtn.closest("[data-al-modal-backdrop]");
      setOpen(modal, false);
      return;
    }
    const backdrop = target.closest("[data-al-modal-backdrop]");
    if (backdrop && target === backdrop) {
      setOpen(backdrop, false);
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    qsa('[data-al-modal-backdrop][data-open="true"]').forEach((modal) => {
      setOpen(modal, false);
    });
  });
}
function initTabs(root) {
  root.addEventListener("click", (e) => {
    const target = (
      /** @type {HTMLElement} */
      e.target
    );
    const tabsRoot = target.closest("[data-al-tabs]");
    if (!tabsRoot || !root.contains(tabsRoot)) return;
    const btn = target.closest('[role="tab"]');
    if (!btn || !tabsRoot.contains(btn)) return;
    const tabId = btn.getAttribute("data-al-tab");
    if (!tabId) return;
    const tablist = tabsRoot.querySelector('[role="tablist"]');
    const tabs = tablist ? [...tablist.querySelectorAll('[role="tab"]')] : [];
    tabs.forEach((tab) => {
      const isSel = tab === btn;
      tab.setAttribute("aria-selected", isSel ? "true" : "false");
      tab.tabIndex = isSel ? 0 : -1;
      tab.classList.toggle("al-tabs__tab--active", isSel);
      const panelId = tab.getAttribute("aria-controls");
      const panel = panelId ? document.getElementById(panelId) : tabsRoot.querySelector(`[data-al-tabpanel="${CSS.escape(tabId)}"]`);
      if (panel) {
        panel.classList.toggle("al-tabs__panel--active", isSel);
        if (isSel) panel.removeAttribute("hidden");
        else panel.setAttribute("hidden", "");
      }
    });
  });
}
function initToggle(root) {
  root.addEventListener("click", (e) => {
    const target = (
      /** @type {HTMLElement} */
      e.target
    );
    const sw = target.closest("[data-al-toggle]");
    if (!sw || !root.contains(sw)) return;
    if (sw.getAttribute("role") !== "switch") return;
    const pressed = sw.getAttribute("aria-checked") === "true";
    const next = !pressed;
    sw.setAttribute("aria-checked", next ? "true" : "false");
  });
}
function buildPageItems(current, total) {
  if (total <= 1) return [1];
  const delta = 2;
  const range = [];
  for (let i = 1; i <= total; i += 1) {
    if (i === 1 || i === total || i >= current - delta && i <= current + delta) {
      range.push(i);
    }
  }
  const out = [];
  let l = 0;
  for (const i of range) {
    if (l) {
      if (i - l === 2) out.push(l + 1);
      else if (i - l !== 1) out.push("ellipsis");
    }
    out.push(i);
    l = i;
  }
  return out;
}
function initPagination(root, getModel, onPageChange) {
  const nav = root.querySelector("[data-al-pagination]");
  if (!nav) {
    return { render: () => {
    } };
  }
  const pagesEl = nav.querySelector("[data-al-pagination-pages]");
  const firstBtn = nav.querySelector("[data-al-page-first]");
  const prevBtn = nav.querySelector("[data-al-page-prev]");
  const nextBtn = nav.querySelector("[data-al-page-next]");
  const lastBtn = nav.querySelector("[data-al-page-last]");
  const render = () => {
    const { currentPage, totalPages } = getModel();
    if (firstBtn) firstBtn.disabled = currentPage <= 1 || totalPages <= 1;
    if (prevBtn) prevBtn.disabled = currentPage <= 1 || totalPages <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages || totalPages <= 1;
    if (lastBtn) lastBtn.disabled = currentPage >= totalPages || totalPages <= 1;
    if (!pagesEl) return;
    pagesEl.innerHTML = "";
    const items = buildPageItems(currentPage, totalPages);
    items.forEach((item) => {
      if (item === "ellipsis") {
        const span = document.createElement("span");
        span.className = "al-pagination__ellipsis";
        span.setAttribute("aria-hidden", "true");
        span.textContent = "···";
        pagesEl.appendChild(span);
        return;
      }
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "al-pagination__page";
      btn.dataset.alPageNum = String(item);
      btn.textContent = String(item);
      if (item === currentPage) {
        btn.classList.add("al-pagination__page--active");
        btn.setAttribute("aria-current", "page");
      }
      pagesEl.appendChild(btn);
    });
  };
  nav.addEventListener("click", (e) => {
    const target = (
      /** @type {HTMLElement} */
      e.target
    );
    const { currentPage, totalPages } = getModel();
    const pageBtn = target.closest("[data-al-page-num]");
    if (pageBtn) {
      const page = Number(pageBtn.getAttribute("data-al-page-num"));
      if (!Number.isFinite(page)) return;
      onPageChange(page);
      return;
    }
    if (target.closest("[data-al-page-first]")) {
      onPageChange(1);
      return;
    }
    if (target.closest("[data-al-page-prev]")) {
      onPageChange(Math.max(1, currentPage - 1));
      return;
    }
    if (target.closest("[data-al-page-next]")) {
      onPageChange(Math.min(totalPages, currentPage + 1));
      return;
    }
    if (target.closest("[data-al-page-last]")) {
      onPageChange(totalPages);
    }
  });
  return { render };
}
const MQ_TABLET = window.matchMedia("(max-width: 1279px)");
function initNavAccordion() {
  const triggers = document.querySelectorAll(".al-sidenav__trigger");
  triggers.forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".al-sidenav__item");
      if (!item) return;
      const wasOpen = item.classList.contains("is-open");
      document.querySelectorAll(".al-sidenav__item.is-open").forEach((el) => {
        el.classList.remove("is-open");
        const b = el.querySelector(".al-sidenav__trigger");
        if (b) b.setAttribute("aria-expanded", "false");
      });
      if (!wasOpen) {
        item.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });
}
function initDrawer() {
  const sidenav = document.getElementById("alSidenav");
  const backdrop = document.getElementById("alBackdrop");
  const menuBtn = document.getElementById("alMenuBtn");
  if (!sidenav || !backdrop || !menuBtn) return;
  function open() {
    sidenav.classList.add("is-open");
    backdrop.classList.add("is-visible");
    document.body.classList.add("al-drawer-open");
    menuBtn.setAttribute("aria-expanded", "true");
  }
  function close() {
    sidenav.classList.remove("is-open");
    backdrop.classList.remove("is-visible");
    document.body.classList.remove("al-drawer-open");
    menuBtn.setAttribute("aria-expanded", "false");
  }
  menuBtn.addEventListener("click", () => {
    if (!MQ_TABLET.matches) return;
    sidenav.classList.contains("is-open") ? close() : open();
  });
  backdrop.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && MQ_TABLET.matches && sidenav.classList.contains("is-open")) {
      close();
    }
  });
  function sync() {
    if (!MQ_TABLET.matches) close();
  }
  MQ_TABLET.addEventListener("change", sync);
  sync();
}
function initSidenav() {
  initNavAccordion();
  initDrawer();
}
function initGuidePage() {
  const root = document.getElementById("alContent");
  if (!root) return;
  const model = {
    files: [],
    filteredFiles: [],
    currentPage: 1,
    pageSize: 5
  };
  const { render: renderPagination } = initPagination(
    root,
    () => ({
      currentPage: model.currentPage,
      totalPages: Math.max(1, Math.ceil(model.filteredFiles.length / model.pageSize))
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
    const a = document.createElement("a");
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
      if (action === "download") handleDownload(fileId);
      if (action === "remove") handleRemove(fileId);
    });
    renderPagination();
  }
  function applyFilter() {
    const kw2 = root.querySelector("[data-al-guide-kw]");
    const keyword = (kw2 instanceof HTMLInputElement ? kw2.value : "").trim().toLowerCase();
    model.filteredFiles = keyword ? model.files.filter(({ file }) => file.name.toLowerCase().includes(keyword)) : [...model.files];
    const tot = root.querySelector("[data-al-total-count]");
    if (tot) tot.textContent = String(model.filteredFiles.length);
    model.currentPage = 1;
    refreshListView();
  }
  function appendValidFiles(newFiles) {
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
  const searchBtn = root.querySelector("[data-al-guide-search]");
  const kw = root.querySelector("[data-al-guide-kw]");
  const runSearch = () => applyFilter();
  searchBtn == null ? void 0 : searchBtn.addEventListener("click", runSearch);
  kw == null ? void 0 : kw.addEventListener("keydown", (e) => {
    if (e.key === "Enter") runSearch();
  });
  applyFilter();
}
document.addEventListener("DOMContentLoaded", () => {
  initSidenav();
});
initGuidePage();
