var fs=require("fs");var f="D:/xiuxian/xiuxian/xiuxian-v2/src/app/api/game/action/route.ts";var c=fs.readFileSync(f,"utf8");
var old="const init = { messages: [new HumanMessage(userInput)], playerId, stats: player.stats as unknown as ICharacterStats, inventory: player.inventory as unknown as IInventoryItem[], relationships: (player.relationships || {}) as any };";
var rep="const init = { messages: [new HumanMessage(userInput)], playerId, stats: player.stats as unknown as ICharacterStats, inventory: player.inventory as unknown as IInventoryItem[], relationships: (player.relationships || {}) as any, codex: (player.codex || []) as any };";
c=c.replace(old,rep);fs.writeFileSync(f,c,"utf8");console.log("done",c.length);
