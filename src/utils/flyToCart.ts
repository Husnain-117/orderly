export const flyToCart = (fromEl: HTMLElement, toEl: HTMLElement) => {
  const fromRect = fromEl.getBoundingClientRect();
  const toRect = toEl.getBoundingClientRect();

  const clone = fromEl.cloneNode(true) as HTMLElement;
  clone.style.position = "fixed";
  clone.style.left = `${fromRect.left}px`;
  clone.style.top = `${fromRect.top}px`;
  clone.style.zIndex = "9999";
  clone.style.pointerEvents = "none";
  clone.style.transform = "scale(1)";
  clone.style.transition = "transform 500ms cubic-bezier(0.4,0,0.2,1), left 500ms, top 500ms, opacity 500ms";
  document.body.appendChild(clone);

  requestAnimationFrame(() => {
    clone.style.left = `${toRect.left}px`;
    clone.style.top = `${toRect.top}px`;
    clone.style.transform = "scale(0.4)";
    clone.style.opacity = "0.7";
  });

  setTimeout(() => clone.remove(), 520);
};
