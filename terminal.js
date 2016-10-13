"use strict";

var Terminal = function () {
    var TERM_SERVICE_UUID = "50270001-df25-45b0-8ad9-b27ceba6622f";

    var WRITE_CHAR_UUID = "50270002-df25-45b0-8ad9-b27ceba6622f";
    var NOTIFY_CHAR_UUID = "50270003-df25-45b0-8ad9-b27ceba6622f";
    var CONFIG_CHAR_UUID = "50270004-df25-45b0-8ad9-b27ceba6622f";

    var GATT_INFO_SERVICE = 0x1800;
    var DEVICE_NAME_CHAR = 0x2a00;

    var INFO_SERVICE = 0x180a;
    var HW_CHAR = 0x2a27;
    var SW_CHAR = 0x2a28;

    function Terminal(bluetooth) {
        this.connected = false;
        this.options = undefined;
        this.scanned_perips = [];
        this.gateway = undefined;
        this.writeCharacteristic = undefined;
        this.configCharacteristic = undefined;
        this.deviceNameCharacteristic = undefined;
        this.hardwareCharacteristic = undefined;
        this.softwareCharacteristic = undefined;
        this.deviceName = undefined;
        this.hardwareVersion = undefined;
        this.softwareVersion = undefined;
        this.configBuffer = undefined;
        this.bluetooth = navigator.bluetooth;
        this.bluetoothDevice = undefined;
    }

    Terminal.prototype.connect = function connect() {
        var self = this;

        var options = {filters: [{services: [TERM_SERVICE_UUID]}]};

        return navigator.bluetooth.requestDevice(options)
            .then(function (device) {
                self.bluetoothDevice = device;
                return device.gatt.connect();
            })
            .then(function (server) {
                return Promise.all([
                    server.getPrimaryService(GATT_INFO_SERVICE)
                        .then(function (service) {
                            return service.getCharacteristic(DEVICE_NAME_CHAR)
                                .then(function (characteristic) {
                                    self.deviceNameCharacteristic = characteristic;
                                    characteristic.readValue()
                                        .then(function (data) {
                                            var value = '';
                                            for (var i = 0; i < data.byteLength; i++) {
                                                value = value + String.fromCharCode(data.getUint8(i));
                                            }
                                            value = value.trim();
                                            self.deviceName = value;
                                        });
                                });
                        }, function (error) {
                            console.warn('GATT Info Service not found');
                            Promise.resolve(true);
                        }),
                    server.getPrimaryService(INFO_SERVICE)
                        .then(function (service) {
                            service.getCharacteristic(HW_CHAR)
                                .then(function (characteristic) {
                                    self.hardwareCharacteristic = characteristic;
                                    characteristic.readValue()
                                        .then(function (data) {
                                            var value = '';
                                            for (var i = 0; i < data.byteLength; i++) {
                                                value = value + String.fromCharCode(data.getUint8(i));
                                            }
                                            value = value.trim();
                                            self.hardwareVersion = value;
                                        });
                                });
                            service.getCharacteristic(SW_CHAR)
                                .then(function (characteristic) {
                                    self.softwareCharacteristic = characteristic;
                                    characteristic.readValue()
                                        .then(function (data) {
                                            var value = '';
                                            for (var i = 0; i < data.byteLength; i++) {
                                                value = value + String.fromCharCode(data.getUint8(i));
                                            }
                                            value = value.trim();
                                            self.softwareVersion = value;
                                        });
                                });
                        }, function (error) {
                            console.warn('Info Service not found');
                            Promise.resolve(true);
                        }),
                    server.getPrimaryService(TERM_SERVICE_UUID)
                        .then(function (service) {
                            self.connected = true;
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
                        }, function (error) {
                            console.warn('TERM_SERVICE_UUID Service not found');
                            Promise.resolve(true);
                        })

                ])
            })
            .then(function () {
                self.connected = true;
            });
    }

    /* Firmware Version read service*/
    Terminal.prototype.readDeviceName = function readDeviceName(char) {
        return char.readValue()
            .then(function (data) {
                var value = '';
                for (var i = 0; i < data.byteLength; i++) {
                    value = value + String.fromCharCode(data.getUint8(i));
                }
                value = value.trim();
                Terminal.deviceName = value;
                return Promise.resolve();
            });
    }

    Terminal.prototype.writeData = function writeData(sendData) {
        if (this.writeCharacteristic) {
            return this.writeCharacteristic.writeValue(sendData);
        }

        return Promise.reject();
    }

    Terminal.prototype.setDeviceName = function setDeviceName(sendData) {
        if (this.deviceNameCharacteristic) {
            return this.deviceNameCharacteristic.writeValue(sendData);
        }

        return Promise.resolve();
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

    Terminal.prototype.disconnect = function disconnect() {
        var self = this;
        if (!self.bluetoothDevice) {
            return Promise.reject();
        }
        return self.bluetoothDevice.disconnect()
            .then(function () {
                self.connected = false;
                self.writeCharacteristic = undefined;
                self.configCharacteristic = undefined;
                self.configBuffer = undefined;

                return Promise.resolve();
            });

    }

    return Terminal;

}();

if (window === undefined) {
    module.exports.Terminal = Terminal;
}