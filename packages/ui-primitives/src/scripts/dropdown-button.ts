import { initDropdown } from './dropdown';

export function initDropdownButton({
  dropdown,
  onSelect,
  onPrimaryAction,
}: {
  dropdown: Element;
  onSelect: (value: string) => void;
  onPrimaryAction: (primaryActionElement: Element) => void;
}) {
  const trigger = dropdown.querySelector<HTMLButtonElement>('[data-part="trigger"]');
  const menu = dropdown.querySelector<HTMLElement>('[data-part="menu"]');
  const primaryAction = dropdown.querySelector('[data-part="primary-action"]');

  if (!trigger) {
    console.error('Dropdown trigger not found');
    return;
  }

  if (!menu) {
    console.error('Dropdown menu not found');
    return;
  }

  if (!primaryAction) {
    console.error('Dropdown primary action not found');
    return;
  }

  primaryAction.addEventListener('click', () => {
    onPrimaryAction(primaryAction);
  });

  initDropdown({
    root: dropdown,
    onSelect,
  });
}
