import { EXPERIMENTAL_COLLAPSIBLE_SNIPPETS } from 'virtual:stl-starlight-virtual-module';
const copyIcon = `<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>`;
const circleAlertIcon = `<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>`;
const checkIcon = `<path d="M20 6 9 17l-5-5"/>`;

function getContent(button: HTMLElement, full: boolean) {
  const isContentCollapsed = !!document.querySelector('.stldocs-snippet-code.stl-snippet-code-is-collapsed');

  const content = button.closest('[data-stldocs-copy-parent]')!.querySelector('[data-stldocs-copy-content]')!;

  const contentCopy = content.cloneNode(true) as HTMLElement;

  contentCopy.querySelectorAll('.ellipsis').forEach((el) => el.remove());
  if (EXPERIMENTAL_COLLAPSIBLE_SNIPPETS && isContentCollapsed && !full) {
    contentCopy.querySelectorAll('.hidden').forEach((el) => el.remove());
    contentCopy.querySelectorAll('.leading-ws').forEach((el) => el.remove());
  }

  return contentCopy.textContent;
}

addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  const copyButton = event.target.closest('[data-stldocs-snippet-copy]');
  if (!(copyButton instanceof HTMLElement)) return;

  if (copyButton) {
    const iconElement = copyButton.querySelector('.stldocs-icon') as SVGElement;
    clearTimeout(copyButton.dataset.__stldocsCopyTimeout);
    navigator.clipboard
      .writeText(getContent(copyButton, false))
      .then(() => {
        iconElement.innerHTML = checkIcon;
      })
      .catch(() => {
        iconElement.innerHTML = circleAlertIcon;
      })
      .finally(() => {
        copyButton.dataset.__stldocsCopyTimeout = setTimeout(() => {
          iconElement.innerHTML = copyIcon;
        }).toString();
      });
  }
});
