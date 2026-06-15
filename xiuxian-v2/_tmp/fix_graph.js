var fs=require("fs");var f="D:/xiuxian/xiuxian/xiuxian-v2/src/lib/game/graph.ts";var c=fs.readFileSync(f,"utf8");
c=c.replace("import { ICharacterStats, IInventoryItem, IRelationships, IntentType }","import { ICharacterStats, IInventoryItem, IRelationships, IntentType, CodexEntry }");
var old="  inventory: Annotation<IInventoryItem[]>({\n    reducer: (x: IInventoryItem[], y: IInventoryItem[] | null) => y ?? x,\n    default: () => [],\n  }),";
var rep="  inventory: Annotation<IInventoryItem[]>({\n    reducer: (x: IInventoryItem[], y: IInventoryItem[] | null) => y ?? x,\n    default: () => [],\n  }),\n  codex: Annotation<CodexEntry[]>({\n    reducer: (x: CodexEntry[], y: CodexEntry[]) => x.concat(y),\n    default: () => [],\n  }),";
c=c.replace(old,rep);fs.writeFileSync(f,c,"utf8");console.log("done",c.length);
