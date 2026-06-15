var fs=require("fs");var f="D:/xiuxian/xiuxian/xiuxian-v2/src/lib/game/nodes.ts";var c=fs.readFileSync(f,"utf8");
var bad="description:(npc.title?npc.title+\": \"+\"\"+npc.description+(npc.realm?\" [\"+npc.realm+\"]\"+\"\")+(npc.sect?\" \"+npc.sect:\"\")+(npc.personality?\" \"+npc.personality:\"\")+\"\"";
var good="description:npc.description+(npc.realm?\" [\"+npc.realm+\"]\":\"\")+(npc.sect?\" \"+npc.sect:\"\")+(npc.personality?\" \"+npc.personality:\"\")";
console.log("found:",c.indexOf(bad)>=0);
c=c.replace(bad,good);fs.writeFileSync(f,c,"utf8");console.log("done",c.length);
