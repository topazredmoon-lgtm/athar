import Site from './site/Site';

/**
 * The public site.
 *
 * One page, four sections: the films, the studio that makes them, and the
 * notes on how they are made. The maker itself lives in `src/site/Studio.tsx`
 * and runs on the same engine as everything else.
 */
export default function App() {
  return <Site />;
}
