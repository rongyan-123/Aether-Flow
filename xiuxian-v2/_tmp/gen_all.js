const fs=require('fs');const p=require('path');const B='D:/xiuxian/xiuxian/xiuxian-v2';function w(f,c){const fp=p.join(B,...f.split('/'));p.mkdirSync(p.dirname(fp),{recursive:true});fs.writeFileSync(fp,c,'utf8');console.log('wrote '+f);}
const toolsSrc = [
 '// game tools
',
 '// Three categories: World Gen (vector DB only), Backpack Ops, Player State
',
 'let _cid = ""
',
 'export function setConversationId(id: string) { _cid = id }
',
 '
',
 "import { DynamicStructuredTool } from '@langchain/core/tools'
",
 "import { z } from 'zod'
",
 "import { storeVector } from '@/lib/vector-store'
",
 '
',
].join('');w('src/lib/game/tools.ts', toolsSrc + [
 'const ItemGradeSchema = z.enum([‘黄阶下品’,...]
',
].join(''));
console.log('gen done');
