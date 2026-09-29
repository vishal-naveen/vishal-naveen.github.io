// The about-page sections: experience, leadership & awards and
// the contact footer. (The tech stack, #stack, belongs to js/sections/pcb.js.) Everything renders from
// content.js. Each section mounts in isolation so one failure never blanks the rest.
import { mountExperience } from './about/experience.js';
import { mountLeadership } from './about/leadership.js';
import { mountContact } from './about/contact.js';

export async function mount(ctx) {
  const parts = [
    ['experience', mountExperience],
    ['leadership', mountLeadership],
    ['contact', mountContact],
  ];
  for (const [id, run] of parts) {
    const el = document.getElementById(id);
    if (!el) continue;
    try { run(el, ctx); } catch (err) { console.error(`[about:${id}]`, err); }
  }
  ctx.lib.observeReveals();
}
