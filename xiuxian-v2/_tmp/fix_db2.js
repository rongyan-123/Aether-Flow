var fs=require("fs");var f="D:/xiuxian/xiuxian/xiuxian-v2/src/lib/game/nodes.ts";var c=fs.readFileSync(f,"utf8");
c=c.replace("const{playerId,stats,inventory,relationships}=state","const{playerId,stats,inventory,relationships,codex}=state");
var old="status:hpCurrent<=0?"+String.fromCharCode(39)+"DEAD"+String.fromCharCode(39)+":"+String.fromCharCode(39)+"ALIVE"+String.fromCharCode(39)+",";
var rep="status:hpCurrent<=0?"+String.fromCharCode(39)+"DEAD"+String.fromCharCode(39)+":"+String.fromCharCode(39)+"ALIVE"+String.fromCharCode(39)+",\n          codex:(codex||[]) as any,";
c=c.replace(old,rep);fs.writeFileSync(f,c,"utf8");console.log("done",c.length);
