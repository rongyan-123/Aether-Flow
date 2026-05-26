const fs=require("fs");const f="D:/xiuxian/xiuxian/xiuxian-v2/src/app/api/game/action/route.ts";let c=fs.readFileSync(f,"utf8");c=c.replace("inventory: player.inventory as unknown as IInventoryItem[],
          };","inventory: player.inventory as unknown as IInventoryItem[],
            relationships: (player.relationships || {}) as any,
          };");fs.writeFileSync(f,c,"utf8");console.log("done");