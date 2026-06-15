var fs=require("fs");var f="D:/xiuxian/xiuxian/xiuxian-v2/src/app/api/game/action/route.ts";var c=fs.readFileSync(f,"utf8");
var Q=String.fromCharCode(34);
var old="var codexEntries = allVectors.filter(function(v){ var m = v.metadata; return m && m.type === "+Q+"codex"+Q+"; })";
var rep="var codexTypes = ["+Q+"npc"+Q+","+Q+"location"+Q+","+Q+"item"+Q+","+Q+"sect"+Q+","+Q+"codex"+Q+"];\n        var codexEntries = allVectors.filter(function(v){ var m = v.metadata; return m && codexTypes.indexOf(m.type) >= 0; })";
c=c.replace(old,rep);fs.writeFileSync(f,c,"utf8");console.log("done",c.length);
