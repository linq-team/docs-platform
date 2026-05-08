const initialized = new WeakSet();

export function initDropdown({
  root,
  onSelect,
  initialValue,
}: {
  root?: Element | null;
  onSelect?: (value: string) => void;
  initialValue?: string | null;
}) {
  if (!root) {
    console.error('Dropdown root element not found');
    return;
  }
  if (initialized.has(root)) {
    return;
  }
  const trigger = root.querySelector<HTMLElement>('[data-part="trigger"]');
  const menu = root.querySelector<HTMLElement>('[data-part="menu"]');

  if (!trigger) {
    console.error('Dropdown trigger not found');
    return;
  }

  if (!menu) {
    console.error('Dropdown menu not found');
    return;
  }

  const selectedSlot = trigger.querySelector('[data-part="trigger-selected"]');

  const items = Array.from(menu.querySelectorAll<HTMLElement>('[data-part="item"]'));

  function open() {
    if (!trigger || !menu || !root) return;
    trigger.setAttribute('aria-expanded', 'true');
    menu.dataset.state = 'open';
    menu.removeAttribute('aria-hidden');

    // Determine if menu should open above or below
    const triggerRect = trigger.getBoundingClientRect();
    const menuHeight = menu.offsetHeight;
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    menu.classList.remove('stl-ui-dropdown-menu--above', 'stl-ui-dropdown-menu--below');

    if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
      menu.classList.add('stl-ui-dropdown-menu--above');
    } else {
      menu.classList.add('stl-ui-dropdown-menu--below');
    }
  }

  function close() {
    if (!trigger || !menu || !root) return;
    trigger.setAttribute('aria-expanded', 'false');
    menu.dataset.state = 'closed';
    menu.setAttribute('aria-hidden', 'true');
  }

  function renderSelectedFromItem(item: Element) {
    // If there is no selected slot, do nothing. This allows for dropdowns without a selected display.
    if (!selectedSlot) {
      return;
    }
    const tmpl = item.querySelector<HTMLTemplateElement>('template[data-part="selected-template"]');

    if (!tmpl) {
      console.error('Dropdown item template not found');
      return;
    }

    selectedSlot.innerHTML = '';
    selectedSlot.appendChild(tmpl.content.cloneNode(true));
    selectedSlot.removeAttribute('data-placeholder');
  }

  function selectItem(item: Element) {
    if (!trigger) {
      console.error('Dropdown trigger not found');
      return;
    }
    items.forEach((i) => i.setAttribute('aria-selected', String(i === item)));
    trigger.dataset.value = item.getAttribute('data-value') || '';
    renderSelectedFromItem(item);
  }

  function handleItemSelection(e: MouseEvent | KeyboardEvent) {
    const item = (e.target as Element).closest('[data-part="item"]');
    if (!item) {
      console.error('Dropdown item not found');
      return;
    }
    if (!trigger) {
      console.error('Dropdown trigger not found');
      return;
    }

    selectItem(item);
    onSelect?.(item.getAttribute('data-value') || '');
    close();
    trigger.focus();
  }

  function handleTriggerClick() {
    if (!trigger) return false;
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';
    if (isOpen) {
      close();
      return false;
    } else {
      open();
      return true;
    }
  }

  // Initialize selected item
  const initial =
    initialValue === null // initialValue null explicitly indicates there should be no initial selected item, not even the fallback first item
      ? null
      : ((initialValue
          ? items.find((i) => i.getAttribute('data-value') === initialValue)
          : items.find((i) => i.getAttribute('aria-selected') === 'true')) ?? items[0]);

  if (initial) selectItem(initial);

  // add event listeners
  trigger.addEventListener('click', () => {
    handleTriggerClick();
  });

  // When using the keyboard to open the dropdown, we focus the first item
  trigger.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    const didOpen = handleTriggerClick();
    if (didOpen) {
      items[0]?.focus();
    }
  });

  menu.addEventListener('click', (e) => {
    handleItemSelection(e);
  });

  document.addEventListener('keydown', (e) => {
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';
    if (!isOpen) return;

    if (e.key === 'Escape') {
      close();
      trigger.focus();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const activeElement = document.activeElement;

      // if the active item is the button itself, focus the first item
      if (activeElement === trigger) {
        items[0]?.focus();
        return;
      }
      let nextSibling = activeElement?.nextElementSibling;
      while (nextSibling && nextSibling.tagName.toLowerCase() === 'hr') {
        nextSibling = nextSibling.nextElementSibling;
      }
      if (nextSibling instanceof HTMLElement && items.includes(nextSibling)) {
        nextSibling.focus();
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const activeElement = document.activeElement;
      // if the active item is the button itself, focus the last item
      if (activeElement === trigger) {
        items[items.length - 1]?.focus();
        return;
      }
      let prevSibling = activeElement?.previousElementSibling;
      while (prevSibling && prevSibling.tagName.toLowerCase() === 'hr') {
        prevSibling = prevSibling.previousElementSibling;
      }
      if (prevSibling instanceof HTMLElement && items.includes(prevSibling)) {
        prevSibling.focus();
      }
      return;
    }
  });

  document.addEventListener('click', (e) => {
    if (!root.contains(e.target as Element)) close();
  });

  initialized.add(root);
}
