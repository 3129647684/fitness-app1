// Web 端占位：这些原生模块只在 native 分支 require，web 下绝不调用
const stub = function () {};
stub.default = stub;
module.exports = stub;