cordova.define("cordova-plugin-blueapp.blueappio", function (require, exports, module) {
    module.exports = {
        request: function (action, message, successCallback, errorCallback) {
            cordova.exec(successCallback, errorCallback, "IOBlueApp", action, [message]);
        }
    };
});
