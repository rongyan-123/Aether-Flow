const fs=require("fs");
const path=require("path");
const B="D:/xiuxian/xiuxian/xiuxian-v2";
function w(f,c){const fp=path.join(B,...f.split("/"));path.mkdirSync(path.dirname(fp),{recursive:true});fs.writeFileSync(fp,c,"utf8");console.log("wrote "+f);}
