// Let users select text in <summary> elements without toggling them

document.addEventListener(
  'mousedown',
  (e) => {
    const summary = (e.target as HTMLElement).closest('summary.stldocs-expander-summary');
    if (!summary) return;
    const selectionOnDown = window.getSelection()?.toString() ?? '';

    document.addEventListener(
      'mouseup',
      () => {
        const selectionOnUp = window.getSelection()?.toString() ?? '';

        if (selectionOnUp && selectionOnUp !== selectionOnDown) {
          summary.addEventListener(
            'click',
            (e) => {
              e.preventDefault();
            },
            { once: true },
          );
        }
      },
      { once: true },
    );
  },
  { capture: true },
);
