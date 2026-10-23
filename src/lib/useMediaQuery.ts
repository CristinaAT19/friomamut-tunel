import { useSyncExternalStore } from 'react';

// true mientras la pantalla cumpla la media query, y se actualiza si cambia (rotar, redimensionar)
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (avisar) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', avisar);
      return () => mq.removeEventListener('change', avisar);
    },
    () => window.matchMedia(query).matches,
  );
}
