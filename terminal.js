"use strict";

var Terminal = function () {

    var TERM_SERVICE_UUID = "50270001-df25-45b0-8ad9-b27ceba6622f";

    var WRITE_CHAR_UUID = "50270002-df25-45b0-8ad9-b27ceba6622f";
    var NOTIFY_CHAR_UUID = "50270003-df25-45b0-8ad9-b27ceba6622f";
    var CONFIG_CHAR_UUID = "50270004-df25-45b0-8ad9-b27ceba6622f";

    function Terminal(bluetooth) {
        this.connected = false;
        this.writeCharacteristic = undefined;
        this.configCharacteristic = undefined;
        this.configBuffer = undefined;
        this.bluetooth = bluetooth;
    }

    Terminal.prototype.connect = function connect() {

        var self = this;

        var options = {filters: [{services: [TERM_SERVICE_UUID]}]};

        return this.bluetooth.requestDevice(options)
            .then(function (device) {
                return device.gatt.connect();
            })
            .then(function (server) {
                return server.getPrimaryService(TERM_SERVICE_UUID)
            })
            .then(function (service) {
                return Promise.all([
                    service.getCharacteristic(CONFIG_CHAR_UUID)
                        .then(function (characteristic) {
                            self.configCharacteristic = characteristic;
                            return self.configCharacteristic.readValue()
                                .then(function (value) {
                                    self.configBuffer = value;
                                });
                        }),
                    service.getCharacteristic(WRITE_CHAR_UUID)
                        .then(function (characteristic) {
                            self.writeCharacteristic = characteristic;
                        }),
                    service.getCharacteristic(NOTIFY_CHAR_UUID)
                        .then(function (characteristic) {
                            return characteristic.startNotifications()
                                .then(function () {
                                    characteristic.addEventListener('characteristicvaluechanged', function (event) {
                                        //todo: generate event
                                        if (self.updateUI) {
                                            self.updateUI(event.target.value);
                                        }
                                    });
                                });
                        })
                ]);
            })
            .then(function () {
                self.connected = true;
            });
    }

    Terminal.prototype.writeData = function writeData(sendData) {
        if (this.writeCharacteristic) {
            return this.writeCharacteristic.writeValue(sendData);
        }

        return Promise.reject();
    }

    Terminal.prototype.writeConfigData = function writeConfigData(cfgData) {
        var self = this;

        if (this.configCharacteristic) {
            return this.configCharacteristic.writeValue(cfgData)
                .then(function () {
                    return self.configCharacteristic.readValue()
                        .then(function (value) {
                            self.configBuffer = value;
                            return Promise.resolve();
                        });
                });
        }
    }

    return Terminal;

}();

if(window === undefined) {
    module.exports.Terminal = Terminal;
}
