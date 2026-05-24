const{Pool}=require('pg');
const fs=require('fs');
const path=require('path');
async function seed(){
var dc=String.fromCharCode(36);
var bt=String.fromCharCode(96);
var sq=String.fromCharCode(39);
var src=fs.readFileSync(path.join('__dirname','..\\..','server','utils','ai.js'),'utf8');
var m=src.match(new RegExp('World_Rule = `([\\s\\S]*?)`'));
if(!m){console.log('no match');process.exit(1);}
var wr=m[1];
var secs=wr.split(/={10,}/);
var chunks=secs.filter(function(s){return s.trim().length>50}).map(function(s){return s.trim()});
console.log('Found '+chunks.length+' chunks');
var pool=new Pool({connectionString:process.env.DATABASE_URL||'postgresql://postgres:password@localhost:5432/xiuxian'});
await pool.query('DELETE FROM world_vectors');
console.log('Cleared.');
for(var i=0;i<chunks.length;i++){
var content=chunks[i].split(bt).join(sq+sq);
await pool.query('INSERT INTO world_vectors (content,metadata) VALUES('+dc+'1,'+dc+'2)',[content,JSON.stringify({index:i})]);
console.log('Inserted '+i);}
var res=await pool.query('SELECT count(*) FROM world_vectors');
console.log('Total:',res.rows[0].count);
await pool.end();
console.log('Done!');}
seed().catch(console.error);