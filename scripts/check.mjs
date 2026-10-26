import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dist=path.join(root,'dist');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
function run(args){const r=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8'});if(r.stdout)process.stdout.write(r.stdout);if(r.stderr)process.stderr.write(r.stderr);assert.equal(r.status,0,args.join(' '));}
for(const file of walk(dist).filter(x=>x.endsWith('.js')))run(['--check',file]);
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(dist,'operations-data.js'),'utf8'),context);
const data=JSON.parse(JSON.stringify(context.window.PortfolioOperations));
assert.deepEqual(data,JSON.parse(fs.readFileSync(path.join(root,'docs/operations-spec.json'),'utf8')));
let count=0;
for(const slug of ['revelyst','verizon'])for(const n of Object.values(data[slug].networks)){
 const ids=n.stages.map(x=>x.id);assert.equal(new Set(ids).size,ids.length);
 assert.deepEqual(new Set(n.groups.flatMap(x=>x[1])),new Set(ids));
 for(const s of n.stages){count++;assert(s.confirmed&&s.interfaceQuestions.length&&s.openQuestions.length);for(const key of ['cycleTimeSeconds','capacityUnitsPerHour','stationCount'])assert.equal(s[key],null);assert.equal(s.routeValidated,false);}
 for(const edge of n.confirmedConnections){assert(ids.includes(edge.from));assert(ids.includes(edge.to));assert(edge.condition);}
}
assert.equal(count,31);assert.equal(data.simulationReadiness.canPredictThroughput,false);
assert.deepEqual(data.verizon.brands,['Apple','Google','Samsung','Motorola','OnePlus']);
assert.deepEqual(data.verizon.networks.reverse.confirmedConnections.map(x=>[x.from,x.to]),[['smart','hospital']]);
for(const file of walk(dist).filter(x=>x.endsWith('.html'))){
 const html=fs.readFileSync(file,'utf8');const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length,`Duplicate HTML id in ${file}`);
 for(const [,attr,value]of html.matchAll(/\b(src|href)="([^"]+)"/g)){
  if(/^(?:https?:|mailto:|data:|#)/.test(value))continue;
  const ref=value.split(/[?#]/)[0];if(!ref)continue;
  assert(!ref.startsWith('/'),'Use a repository-relative path: '+value);
  const target=path.resolve(path.dirname(file),ref);assert(target.startsWith(dist+path.sep)||target===dist);assert(fs.existsSync(target),`Missing ${attr} ${value} in ${file}`);
 }
 assert(!html.includes('thrinadh-engineering.eeshpradeep.chatgpt.site'),'Hard-coded hosting origin found');
}
console.log('PASS: JavaScript syntax; 31 sourced process records; mirrored JSON; null operating inputs; model-readiness boundary; local assets and portable links.');
run(['tests/navigation.cjs']);run(['tests/flow.cjs']);
run(['tests/precision.cjs']);run(['tests/verizon.cjs']);

run(['tests/lab.cjs']);run(['tests/lab-ui.cjs']);
run(['tests/motion.cjs']);
