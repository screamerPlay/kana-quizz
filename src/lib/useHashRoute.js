import { useEffect, useState } from 'react';

// Tiny hash router: "#/hiragana" → "hiragana". Hash routing works on GitHub Pages with no 404 hacks.
const read = () => window.location.hash.replace(/^#\/?/, '') || '';

export function useHashRoute() {
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onChange = () => setRoute(read());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
