import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const GAP = 6;   // space between button and menu
const EDGE = 8;  // minimum distance from the screen edge

// Dropdown that can never leave the screen.
// It is rendered in <body> (so no parent with overflow / small width can clip it),
// positioned next to `anchorRef`, flips upward when there is no room below, is clamped
// inside the viewport and scrolls internally when it is taller than the free space.
// Closes on outside click / tap, Escape and page scroll.
const FloatingMenu = ({ open, anchorRef, onClose, align = "end", width, minWidth, className = "", children }) => {
  const menuRef = useRef(null);
  const [pos, setPos] = useState(null);

  const place = useCallback(() => {
    const anchor = anchorRef?.current;
    const menu = menuRef.current;
    if (!anchor || !menu) return;

    const a = anchor.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const w = Math.min(menu.offsetWidth, vw - EDGE * 2);
    const h = menu.scrollHeight;

    let left = align === "start" ? a.left : a.right - w;
    left = Math.max(EDGE, Math.min(left, vw - w - EDGE));

    const spaceBelow = vh - a.bottom - GAP - EDGE;
    const spaceAbove = a.top - GAP - EDGE;
    const openUp = h > spaceBelow && spaceAbove > spaceBelow;
    const room = Math.max(120, openUp ? spaceAbove : spaceBelow);
    const top = openUp ? a.top - GAP - Math.min(h, room) : a.bottom + GAP;

    setPos({ left, top, maxHeight: room });
  }, [anchorRef, align]);

  // measure after render, before paint (no flicker)
  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    place();
  }, [open, place, children]);

  useEffect(() => {
    if (!open) return;

    const onOutside = (e) => {
      if (menuRef.current?.contains(e.target) || anchorRef?.current?.contains(e.target)) return;
      onClose?.();
    };
    const onKey = (e) => e.key === "Escape" && onClose?.();
    const onScroll = (e) => {
      if (menuRef.current?.contains(e.target)) return; // scrolling inside the menu is fine
      onClose?.();
    };

    document.addEventListener("mousedown", onOutside);
    document.addEventListener("touchstart", onOutside, { passive: true });
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("touchstart", onOutside);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", place);
    };
  }, [open, onClose, place, anchorRef]);

  if (!open) return null;

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      className={`bg-white rounded shadow border ${className}`}
      style={{
        position: "fixed",
        left: pos?.left ?? 0,
        top: pos?.top ?? 0,
        visibility: pos ? "visible" : "hidden",
        zIndex: 1080,
        width,
        minWidth,
        maxWidth: `calc(100vw - ${EDGE * 2}px)`,
        maxHeight: pos?.maxHeight,
        overflowY: "auto",
      }}
    >
      {children}
    </div>,
    document.body
  );
};

export default FloatingMenu;
