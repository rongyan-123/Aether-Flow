var fs=require("fs");var f="D:/xiuxian/xiuxian/xiuxian-v2/src/lib/game/nodes.ts";var c=fs.readFileSync(f,"utf8");var Q=String.fromCharCode(39);
c=c.replace("const{messages,stats,inventory}=state","const{messages,stats,inventory,codex}=state");
c=c.replace("const newInventory=[...inventory]","const newInventory=[...inventory]\nconst newCodex=[...(codex||[])]");
c=c.replace("return{stats:newStats,inventory:newInventory,deltas}","return{stats:newStats,inventory:newInventory,codex:newCodex,deltas}");
fs.writeFileSync(f,c,"utf8");console.log("done",c.length);
