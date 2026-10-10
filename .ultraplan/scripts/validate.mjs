import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dir=path.join(root,'.ultraplan');
const plan=JSON.parse(fs.readFileSync(path.join(dir,'active-plan.json'),'utf8'));
const seeds=JSON.parse(fs.readFileSync(path.join(root,'.agent-hub/tasks.json'),'utf8')).filter(t=>/^ECO-/.test(t.id));
const config=JSON.parse(fs.readFileSync(path.join(root,'.agent-hub/config.json'),'utf8'));
assert.deepEqual(plan.phaseDependencies,config.phaseDependencies,'Plan must preserve actual hub phase gates.');
const reqs=new Set(plan.requirements.map(r=>r.id)), ids=new Set(plan.tasks.map(t=>t.id));
assert.equal(ids.size,plan.tasks.length,'Duplicate task ID.');
assert.equal(reqs.size,plan.requirements.length,'Duplicate requirement ID.');
assert.deepEqual([...new Set(plan.sections.flatMap(s=>s.hubTasks))].sort(),seeds.map(t=>t.id).sort(),'All and only 58 owner ECO units must be mapped.');
const covered=new Set();
const decode=v=>v.replaceAll('&quot;','"').replaceAll('&gt;','>').replaceAll('&lt;','<').replaceAll('&amp;','&');
for(const task of plan.tasks) {
 assert(task.requirements.length,`${task.id}: unmapped task.`);
 for(const r of task.requirements){assert(reqs.has(r),`${task.id}: unknown requirement ${r}.`);covered.add(r);}
 assert(task.files.length<=3,`${task.id}: more than three files.`);
 assert(task.type==='checkpoint'||task.files.length>0,`${task.id}: automatic task requires exact files.`);
 for(const file of task.files)assert(!path.isAbsolute(file)&&!file.includes('..')&&!file.startsWith('plugins/wordpress-mcp')&&!file.includes('PLACEHOLDER'),`${task.id}: unsafe/protected path.`);
 for(const dep of task.dependsOn)assert(ids.has(dep)&&dep!==task.id,`${task.id}: missing/self dependency.`);
 const section=plan.sections.find(s=>s.id===task.section); assert(section,`${task.id}: section absent.`);
 const body=fs.readFileSync(path.join(dir,section.file),'utf8');
 const block=body.match(new RegExp(`<task type="${task.type}" id="${task.id}">([\\s\\S]*?)</task>`));assert(block,`${task.id}: XML absent.`);
 for(const field of ['name','action','verify','done']) {
  const match=block[1].match(new RegExp(`<${field}>([\\s\\S]*?)</${field}>`));
  assert(match&&decode(match[1]).trim()===task[field].trim(),`${task.id}: XML ${field} disagrees with manifest.`);
 }
 const files=block[1].match(/<files>([\s\S]*?)<\/files>/);assert(files&&decode(files[1])===(task.files.join(', ')||'none'),`${task.id}: XML files disagree.`);
}
assert.equal(covered.size,reqs.size,'Missing requirement coverage.');
const visiting=new Set(),done=new Set();
function visit(id){assert(!visiting.has(id),'Dependency cycle at '+id);if(done.has(id))return;visiting.add(id);for(const d of plan.tasks.find(t=>t.id===id).dependsOn)visit(d);visiting.delete(id);done.add(id);}
plan.tasks.forEach(t=>visit(t.id));
for(const section of plan.sections) {
 const count=plan.tasks.filter(t=>t.section===section.id).length;
 assert(count>=3&&count<=8,`${section.id}: expected 3-8 atomic/checkpoint slices.`);
 for(const dep of section.dependsOn)assert(plan.sections.some(s=>s.id===dep),`${section.id}: missing section dependency.`);
}
for(const file of ['SUMMARY.md','STATE.md','DISCOVERY.md','RESEARCH.md','PRD.md','PLAN.md','VALIDATE.md','REVIEW.md','TRACKING.md','sections/index.md'])assert(fs.existsSync(path.join(dir,file)),`Missing required artifact: ${file}`);
console.log(`PASS: ${plan.sections.length} active sections; ${plan.tasks.length} XML/manifest tasks; ${seeds.length} owner units; ${reqs.size} requirements; DAG, exact file bounds, phase gates and bidirectional coverage.`);
console.log('Structural plan validation only. Owner approval and application acceptance are separate.');
