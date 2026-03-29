const EventEmitter = require("events");
// 导出一个全局的广播对象（单例）
module.exports = new EventEmitter();
