/**
 * 커스텀 Select 드롭다운 컴포넌트
 * 네이티브 select를 커스텀 드롭다운으로 변환
 */
class CustomSelect {
  constructor(selectElement) {
    this.select = selectElement;
    this.options = Array.from(this.select.options);
    this.selectedIndex = this.select.selectedIndex;
    this.isOpen = false;
    this.activeIndex = Math.max(0, this.selectedIndex);
    this.typeBuffer = '';
    this.typeTimer = null;
    
    this.init();
  }
  
  init() {
    this.boundKeydown = this.onKeydown.bind(this);
    if (this.select.dataset.customSelectReady === 'true') return;
    this.select.dataset.customSelectReady = 'true';

    // 원본 select 숨기기
    this.select.style.display = 'none';
    
    // 커스텀 드롭다운 생성
    this.createCustomSelect();
    
    // 이벤트 리스너
    this.setupEvents();
  }
  
  createCustomSelect() {
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select';
    wrapper.dataset.customSelect = 'true';
    
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'custom-select__button';
    button.textContent = this.select.options[this.select.selectedIndex]?.text || '';
    button.setAttribute('aria-haspopup', 'listbox');
    button.setAttribute('aria-expanded', 'false');
    
    const dropdown = document.createElement('div');
    dropdown.className = 'custom-select__dropdown';
    dropdown.setAttribute('role', 'listbox');
    dropdown.setAttribute('tabindex', '-1');
    
    this.options.forEach((option, index) => {
      const item = document.createElement('div');
      item.className = 'custom-select__option';
      item.setAttribute('role', 'option');
      item.id = `cs-opt-${Math.random().toString(16).slice(2)}-${index}`;
      if (index === this.selectedIndex) {
        item.classList.add('is-selected');
        item.setAttribute('aria-selected', 'true');
      }
      item.textContent = option.text;
      item.dataset.value = option.value;
      item.dataset.index = index;
      
      item.addEventListener('click', () => {
        this.selectOption(index);
      });
      
      dropdown.appendChild(item);
    });
    
    this.select.parentNode.insertBefore(wrapper, this.select);
    wrapper.appendChild(button);
    wrapper.appendChild(dropdown);
    wrapper.appendChild(this.select);

    this.wrapper = wrapper;
    this.button = button;
    this.dropdown = dropdown;

    this.setActiveIndex(this.activeIndex, { scroll: false });
  }
  
  setupEvents() {
    this.boundPosition = this.updateDropdownPosition.bind(this);

    // 버튼 클릭
    this.button.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    // 키보드 조작
    this.button.addEventListener('keydown', this.boundKeydown);
    
    // 외부 클릭 시 닫기
    document.addEventListener('click', (e) => {
      if (!this.wrapper.contains(e.target)) {
        this.close();
      }
    });

    // 다른 셀렉트가 열릴 때 자동 닫기
    document.addEventListener('custom-select:open', (e) => {
      if (e.detail?.id !== this.wrapper.dataset.csId) this.close();
    });
    
    // 원본 select 변경 감지
    this.select.addEventListener('change', () => {
      this.updateButton();
    });

    if (!this.wrapper.dataset.csId) {
      this.wrapper.dataset.csId = `cs-${Math.random().toString(16).slice(2)}`;
    }

    window.addEventListener('resize', this.boundPosition);
    window.addEventListener('scroll', this.boundPosition, true);
  }
  
  toggle() {
    this.isOpen = !this.isOpen;
    this.wrapper.classList.toggle('is-open', this.isOpen);
    this.button.setAttribute('aria-expanded', this.isOpen ? 'true' : 'false');
    if (this.isOpen) {
      document.dispatchEvent(new CustomEvent('custom-select:open', { detail: { id: this.wrapper.dataset.csId } }));
      this.setDropDirection();
      this.setActiveIndex(this.select.selectedIndex, { scroll: true });
    } else {
      this.wrapper.classList.remove('is-up');
    }
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.wrapper.classList.add('is-open');
    this.button.setAttribute('aria-expanded', 'true');
    document.dispatchEvent(new CustomEvent('custom-select:open', { detail: { id: this.wrapper.dataset.csId } }));
    this.setDropDirection();
    this.setActiveIndex(this.select.selectedIndex, { scroll: true });
  }

  onKeydown(e) {
    const key = e.key;

    if (key === 'ArrowDown') {
      e.preventDefault();
      if (!this.isOpen) this.open();
      this.setActiveIndex(Math.min(this.options.length - 1, this.activeIndex + 1), { scroll: true });
      return;
    }

    if (key === 'ArrowUp') {
      e.preventDefault();
      if (!this.isOpen) this.open();
      this.setActiveIndex(Math.max(0, this.activeIndex - 1), { scroll: true });
      return;
    }

    if (key === 'Home') {
      e.preventDefault();
      if (!this.isOpen) this.open();
      this.setActiveIndex(0, { scroll: true });
      return;
    }

    if (key === 'End') {
      e.preventDefault();
      if (!this.isOpen) this.open();
      this.setActiveIndex(this.options.length - 1, { scroll: true });
      return;
    }

    if (key === 'Enter' || key === ' ') {
      e.preventDefault();
      if (!this.isOpen) {
        this.open();
        return;
      }
      this.selectOption(this.activeIndex);
      return;
    }

    if (key === 'Escape') {
      e.preventDefault();
      this.close();
      return;
    }

    // typeahead (간단)
    if (key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      this.typeBuffer += key.toLowerCase();
      clearTimeout(this.typeTimer);
      this.typeTimer = setTimeout(() => (this.typeBuffer = ''), 450);

      const idx = this.options.findIndex((o) => o.text.toLowerCase().startsWith(this.typeBuffer));
      if (idx >= 0) {
        if (!this.isOpen) this.open();
        this.setActiveIndex(idx, { scroll: true });
      }
    }
  }

  setActiveIndex(index, { scroll }) {
    this.activeIndex = Math.max(0, Math.min(this.options.length - 1, index));
    const items = [...this.dropdown.querySelectorAll('.custom-select__option')];
    items.forEach((el, i) => {
      el.classList.toggle('is-active', i === this.activeIndex);
    });

    const active = items[this.activeIndex];
    if (active?.id) {
      this.button.setAttribute('aria-activedescendant', active.id);
    }

    if (scroll && active) {
      const rect = active.getBoundingClientRect();
      const dRect = this.dropdown.getBoundingClientRect();
      if (rect.top < dRect.top) active.scrollIntoView({ block: 'nearest' });
      if (rect.bottom > dRect.bottom) active.scrollIntoView({ block: 'nearest' });
    }
  }

  setDropDirection() {
    this.updateDropdownPosition();
  }

  updateDropdownPosition() {
    if (!this.isOpen) return;

    const rect = this.button.getBoundingClientRect();
    const gap = 6;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const dropdownHeight = Math.min(this.dropdown.scrollHeight || 240, 240);
    const isUp = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    this.wrapper.classList.toggle('is-up', isUp);
  }

  close() {
    this.isOpen = false;
    this.wrapper.classList.remove('is-open');
    this.wrapper.classList.remove('is-up');
    this.button.setAttribute('aria-expanded', 'false');
  }
  
  selectOption(index) {
    this.select.selectedIndex = index;
    this.selectedIndex = index;
    
    // change 이벤트 트리거
    const event = new Event('change', { bubbles: true });
    this.select.dispatchEvent(event);
    
    this.updateButton();
    this.updateOptions();
    this.close();
  }
  
  updateButton() {
    this.button.textContent = this.select.options[this.select.selectedIndex]?.text || '';
  }
  
  updateOptions() {
    this.dropdown.querySelectorAll('.custom-select__option').forEach((item, index) => {
      if (index === this.select.selectedIndex) {
        item.classList.add('is-selected');
        item.setAttribute('aria-selected', 'true');
      } else {
        item.classList.remove('is-selected');
        item.setAttribute('aria-selected', 'false');
      }
    });
    this.setActiveIndex(this.select.selectedIndex, { scroll: false });
  }
}

// 자동 초기화 (옵트인)
// 커스텀으로 바꾸고 싶은 select만 지정해서 변환합니다.
// 사용법: <select data-custom-select> 또는 <select class="js-custom-select">
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('select.form__select, select[data-custom-select], select.js-custom-select').forEach(select => {
    if (select.closest('.custom-select')) return;
    new CustomSelect(select);
  });
});

