'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook to manage scoped Ctrl+A (Select All) behavior per panel:
 * - When cursor/focus/hover is in Panel A -> Ctrl+A selects ONLY Panel A's content
 * - When cursor/focus/hover is in Panel B -> Ctrl+A selects ONLY Panel B's content
 * - When cursor/focus/hover is in Study Note -> Ctrl+A selects ONLY Study Note's content
 * - Prevents the entire webpage (all 3 panels + UI) from being selected together
 */
export function usePanelShortcuts() {
  const hoveredPanelRef = useRef<'A' | 'B' | 'note' | null>(null);
  const lastClickedPanelRef = useRef<'A' | 'B' | 'note' | null>(null);

  useEffect(() => {
    // 1. Track which panel the mouse pointer is currently hovering over
    const handlePointerOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const panelEl = target?.closest('[data-panel-id]');
      if (panelEl) {
        const id = panelEl.getAttribute('data-panel-id') as 'A' | 'B' | 'note';
        if (id === 'A' || id === 'B' || id === 'note') {
          hoveredPanelRef.current = id;
        }
      }
    };

    const handlePointerOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-panel-id]')) {
        const related = e.relatedTarget as HTMLElement | null;
        const nextPanel = related?.closest('[data-panel-id]');
        if (nextPanel) {
          const nextId = nextPanel.getAttribute('data-panel-id') as 'A' | 'B' | 'note';
          if (nextId === 'A' || nextId === 'B' || nextId === 'note') {
            hoveredPanelRef.current = nextId;
            return;
          }
        }
        hoveredPanelRef.current = null;
      }
    };

    // 2. Track which panel the user clicked / focused
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const panelEl = target?.closest('[data-panel-id]');
      if (panelEl) {
        const id = panelEl.getAttribute('data-panel-id') as 'A' | 'B' | 'note';
        if (id === 'A' || id === 'B' || id === 'note') {
          lastClickedPanelRef.current = id;
        }
      }
    };

    // 3. Intercept Ctrl+A (Windows/Linux) or Cmd+A (Mac)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        !(e.ctrlKey || e.metaKey) ||
        e.altKey ||
        e.shiftKey ||
        (e.key !== 'a' && e.key !== 'A')
      ) {
        return;
      }

      const activeEl = document.activeElement as HTMLElement | null;

      // Allow native select-all when user is inside regular input or textarea (e.g., URL bar or Title bar)
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')
      ) {
        return;
      }

      // If a modal dialog is open, let modal handle it
      if (activeEl?.closest('[role="dialog"]') || document.querySelector('.modal-open')) {
        return;
      }

      // If user is actively typing inside TipTap editor (ProseMirror),
      // TipTap's built-in keymap already selects only the editor content.
      if (activeEl?.closest('.ProseMirror')) {
        return;
      }

      // Determine which panel is targeted:
      // Priority 1: Panel currently hovered by mouse ("커서를 패널에 놓고")
      let targetPanel: 'A' | 'B' | 'note' | null = hoveredPanelRef.current;

      // Priority 2: Panel where text caret / selection anchor currently resides
      if (!targetPanel) {
        const sel = window.getSelection();
        if (sel && sel.anchorNode) {
          const el =
            sel.anchorNode instanceof Element
              ? sel.anchorNode
              : sel.anchorNode.parentElement;
          const panelEl = el?.closest('[data-panel-id]');
          if (panelEl) {
            targetPanel = panelEl.getAttribute('data-panel-id') as 'A' | 'B' | 'note';
          }
        }
      }

      // Priority 3: Panel last clicked by user
      if (!targetPanel) {
        targetPanel = lastClickedPanelRef.current;
      }

      // If no panel is identified (e.g. cursor is on outer navbar),
      // prevent the whole webpage from being selected!
      if (!targetPanel) {
        e.preventDefault();
        return;
      }

      // Prevent the browser default whole-page selection
      e.preventDefault();
      e.stopPropagation();

      // Scoped selection: select ONLY the content of the target panel
      if (targetPanel === 'A' || targetPanel === 'B') {
        const contentEl =
          document.querySelector(`[data-panel-content="${targetPanel}"]`) ||
          document.querySelector(`[data-panel-content-fallback="${targetPanel}"]`);

        if (contentEl) {
          const selection = window.getSelection();
          if (selection) {
            const range = document.createRange();
            range.selectNodeContents(contentEl);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      } else if (targetPanel === 'note') {
        const editorEl =
          document.querySelector('[data-panel-content="note"]') ||
          document.querySelector('.ProseMirror');

        if (editorEl) {
          const selection = window.getSelection();
          if (selection) {
            const range = document.createRange();
            range.selectNodeContents(editorEl);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      }
    };

    window.addEventListener('pointerover', handlePointerOver, { capture: true });
    window.addEventListener('pointerout', handlePointerOut, { capture: true });
    window.addEventListener('pointerdown', handlePointerDown, { capture: true });
    window.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener('pointerover', handlePointerOver, { capture: true });
      window.removeEventListener('pointerout', handlePointerOut, { capture: true });
      window.removeEventListener('pointerdown', handlePointerDown, { capture: true });
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, []);
}
