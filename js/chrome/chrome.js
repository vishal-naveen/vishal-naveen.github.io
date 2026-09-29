// Site chrome: the nav and magnetic buttons. There is no preloader any more, so the hero is released
// immediately (the 'loader:done' event stays in the contract for the parts that still await it).
import { mountNav } from './nav.js';
import { mountMagnetic } from './magnetic.js';

export async function mount(ctx) {
  ctx.emit('loader:done');
  for (const [name, run] of [['nav', mountNav], ['magnetic', mountMagnetic]]) {
    try {
      await run(ctx);
    } catch (err) {
      console.error(`[chrome:${name}]`, err);
    }
  }
}
