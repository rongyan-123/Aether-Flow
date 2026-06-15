var fs=require("fs");var f="D:/xiuxian/xiuxian/xiuxian-v2/src/lib/game/nodes.ts";var c=fs.readFileSync(f,"utf8");
c=c.replace("const{playerId,stats,inventory,relationships}=state","const{playerId,stats,inventory,relationships,codex}=state");
c=c.replace("status:hpCurrent<=0?\\\"DEAD\\\":\\\"ALIVE\\\",","status:hpCurrent<=0?\\\"DEAD\\\":\\\"ALIVE\\\",\n        codex:(codex||[]) as any,");
fs.writeFileSync(f,c,"utf8");console.log("done",c.length);
