declare module 'react-dom' {
  import type { ReactNode, ReactPortal } from 'react';

  /**
   * Renders children into a DOM container outside the current React tree.
   */
  export function createPortal(
    children: ReactNode,
    container: Element | DocumentFragment,
    key?: null | string
  ): ReactPortal;
}
