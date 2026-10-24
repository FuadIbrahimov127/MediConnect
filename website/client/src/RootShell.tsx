import { Outlet, ScrollRestoration } from 'react-router-dom';
import { DevPanel } from './dev/DevPanel';

const showDevPanel = import.meta.env.DEV || import.meta.env.VITE_DEMO === 'true';

/** Bütün route-ların kökü: scroll bərpası + (lokal demo zamanı) dev panel. */
export function RootShell() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
      {showDevPanel && <DevPanel />}
    </>
  );
}
