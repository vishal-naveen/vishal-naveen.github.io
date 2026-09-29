// Site chrome: the loading screen (it emits 'loader:done' as it lifts), the nav and magnetic buttons.
import { mountNav } from './nav.js';
import { mountMagnetic } from './magnetic.js';
import { mountLoader } from './loader.js';

export async function mount(ctx) {
  mountLoader(ctx);
  for (const [name, run] of [['nav', mountNav], ['magnetic', mountMagnetic]]) {
    try {
      await run(ctx);
    } catch (err) {
      console.error(`[chrome:${name}]`, err);
    }
  }
}
