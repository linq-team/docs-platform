import React, { useEffect } from 'react';

const THRESHOLD_FROM_BOTTOM = 32; // px

/** Keep chat area scrolled to bottom */
export function useScrollToBottom(
  scrollAreaRef: React.RefObject<HTMLDivElement | null>,
  scrollContentsRef: React.RefObject<HTMLDivElement | null>,
  watchValue: unknown,
) {
  /**
   * Set `overflow` based on whether content is actually overflowing.
   *   - The reason this behavior is different than `overflow: auto` is that `overflow: auto` would
   *     show scrollbars while `motion` transitions are in flight applying scale correction to the
   *     children (i.e. while the chat area is animating to accommodate increased child height).
   *   - If we measure with `offsetHeight`/`clientHeight`, we only see the eventual “resting”
   *     dimensions (unaffected by transforms) so we know better whether a scrollbar should actually
   *     show, and avoid distracting flicker of scrollbars appearing & disappearing
   */
  useEffect(() => {
    if (!scrollAreaRef.current || !scrollContentsRef.current) return;
    const containerStyle = getComputedStyle(scrollAreaRef.current);
    const scrollAreaHeight = scrollAreaRef.current.clientHeight;
    const scrollContentsHeight = // scrollHeight is sometimes off; maybe because of scale correction?
      scrollContentsRef.current.offsetHeight +
      parseFloat(containerStyle.paddingTop) +
      parseFloat(containerStyle.paddingBottom);
    const canScroll = scrollContentsHeight > scrollAreaHeight + 1;
    scrollAreaRef.current.style.overflowY = canScroll ? 'auto' : 'hidden';
  }, [watchValue, scrollAreaRef, scrollContentsRef]);

  /**
   * Flip scroll direction based on user’s scroll position
   *   - By default, we need to keep the container scrolled all the way to the end during streaming,
   *     so that the user sees the new content that is appearing.
   *   - However, if the user scrolls upwards to read previous content, we shouldn’t scroll them
   *     back to the bottom while they’re trying to read content further up, even if more content is
   *     streaming.
   *
   * The smoothest way to accomplish this interaction is to flip the container’s scroll direction
   * using flex-direction:
   *   - When the scroll position is near the bottom, scrolling should run in reverse direction—so
   *     that at a constant `0` scrollTop, the scroll stays at the end (no js-driven scrolling with
   *     distracting scrollbar flashing).
   *   - When the user scrolls upwards by a certain threshold, we flip scroll direction to normal,
   *     so that as scroll position holds constant, the still-streaming content below doesn’t push
   *     up the content the user is trying to read.
   *
   * When changing the flex direction, the meaning of `scrollTop` changes dramatically, so we need
   * to manually adjust `scrollTop` to keep the scroll position visually seamless.
   */
  useEffect(() => {
    if (!scrollAreaRef.current) return;
    const ac = new AbortController();
    scrollAreaRef.current.addEventListener(
      'scroll',
      (e) => {
        const scroller = e.currentTarget;
        if (!(scroller instanceof HTMLElement)) return;
        const appliedScrollDirection = scroller.classList.contains('scrolls-up') ? 'up' : 'down';
        if (!appliedScrollDirection) return;
        const { scrollHeight, clientHeight, scrollTop } = scroller;
        // scrollTop is measured from the opposite edge depending on the appliedScrollDirection
        // prettier-ignore
        const distanceFromBottom = appliedScrollDirection === 'up'
          ? -scrollTop
          : scrollHeight - clientHeight - scrollTop;

        // apply reverse scroll when the container is scrolled near the bottom, so that new content
        // pushes old content up and the bottom edge stays constant.
        if (appliedScrollDirection === 'down' && distanceFromBottom < THRESHOLD_FROM_BOTTOM) {
          scroller.classList.add('scrolls-up');
          scroller.scrollTop = -distanceFromBottom;
        }
        // flip to forward scroll when the user scrolls up from the bottom, so that new content
        // doesn’t push up the content the user is trying to read.
        if (appliedScrollDirection === 'up' && distanceFromBottom > THRESHOLD_FROM_BOTTOM) {
          scroller.classList.remove('scrolls-up');
          scroller.scrollTop = scrollHeight - clientHeight + scrollTop;
        }
      },
      { capture: false, signal: ac.signal },
    );
    return () => ac.abort();
  }, [scrollAreaRef]);
}
