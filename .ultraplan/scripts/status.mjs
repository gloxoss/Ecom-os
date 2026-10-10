// Read-only view of the canonical hub. No duplicate task statuses are persisted.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const plan=JSON.parse(fs.readFileSync(path.join(root,'.ultraplan/active-plan.json'),'utf8'));
const hub=JSON.parse(execFileSync(process.execPath,[path.join(root,'.agent-hub/hub.mjs'),'status'],{cwd:root,encoding:'utf8'}));
const units=[...new Set(plan.sections.flatMap(s=>s.hubTasks))];
const dimensions=[['Core',units.filter(id=>hub.tasks[id]?.phase!==7&&hub.tasks[id]?.phase!==8)],['RFQ addon',units.filter(id=>hub.tasks[id]?.phase===7)],['ParaLoca',units.filter(id=>hub.tasks[id]?.phase===8)]];
console.log('EcomOS progress, '+new Date().toISOString());
console.log('Hub records acceptance; this view does not certify fresh tests or production readiness.');
console.log(`Plan: ${plan.sections.length} active sections / ${plan.tasks.length} slices / ${units.length} owner ECO units; approval: ${plan.approval}.`);
for(const [name,ids] of dimensions)console.log(`${name}: ${ids.filter(id=>hub.tasks[id]?.status==='ACCEPTED').length}/${ids.length} hub-accepted units.`);
for(let phase=0;phase<=9;phase++) {
 const ids=units.filter(id=>hub.tasks[id]?.phase===phase);
 const accepted=ids.filter(id=>hub.tasks[id]?.status==='ACCEPTED').length;
 const current=ids.filter(id=>!['OPEN','ACCEPTED'].includes(hub.tasks[id]?.status)).map(id=>`${id}: ${hub.tasks[id]?.status} (${hub.tasks[id]?.claim?.owner||hub.tasks[id]?.assignment?.to||'unassigned'})`);
 console.log(`Phase ${phase}: ${accepted}/${ids.length} accepted; gate ${hub.gates[phase]?'RECORDED @ '+hub.gates[phase].commit.slice(0,7):'NOT RECORDED'}${current.length?'; '+current.join('; '):''}`);
}
console.log('Audit conditions: actual production-browser proof and exact-SHA execution provenance remain open until separately evidenced.');
console.log('Atomic slice completion: not inferred from parent acceptance. Record slice IDs and exact checks in canonical task evidence.');
console.log('Planning/governance tasks are excluded from the 58-unit application denominator.');
