cordova.define("cordova-plugin-dfu.dfuimpl", function (require, exports, module) {
    module.exports = {
        request: function (action, message, successCallback, errorCallback) {
            cordova.exec(successCallback, errorCallback, "DFUImpl", action, [message]);
        }
    };
});
