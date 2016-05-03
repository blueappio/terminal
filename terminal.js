(function() {
  "use strict";

    var util = new Util();

    var PUBLIC_SERVICE_UUID   = "50270001-DF25-45B0-8AD9-B27CEBA6622F";

    var WRITE_CHAR_UUID   = "50270002-DF25-45B0-8AD9-B27CEBA6622F";
    var NOTIFY_CHAR_UUID  = "50270003-DF25-45B0-8AD9-B27CEBA6622F";
    var CONFIG_CHAR_UUID  = "50270004-DF25-45B0-8AD9-B27CEBA6622F";

  class terminal {
    constructor() {
      this.configData = '';
      this.terminaldata = '';
      this.characteristics = new Map();
      
      if(!navigator.bluetooth) {
        console.error('bluetooth not supported');
      }
    }

    connect() {
      var options = {filters:[{name: 'BluTerm',}]};
      return navigator.bluetooth.requestDevice(options).then(function (device) {
        window.terminal.device = device;
        return device.connectGATT();
      }).then(function (server) {
        window.terminal.server = server;
        return Promise.all([
          server.getPrimaryService(PUBLIC_SERVICE_UUID)
          .then(function (service) {
          return Promise.all([
            window.terminal._cacheCharacteristic(service, WRITE_CHAR_UUID),
            window.terminal._cacheCharacteristic(service, NOTIFY_CHAR_UUID),
            window.terminal._cacheCharacteristic(service, CONFIG_CHAR_UUID),
            service.getCharacteristic(NOTIFY_CHAR_UUID)
            .then(function (characteristic) {
              characteristic.addEventListener('characteristicvaluechanged', window.terminal.onNotify);
              return characteristic.startNotifications();
            })]);
        })]);
      });
    }

    /* Smart Light Services */

    writeData(hex_data){
      var data = util.convertHexStringToNumArray(hex_data);
      return window.terminal._writeCharacteristicValue(WRITE_CHAR_UUID, new Uint8Array(data));
    }

    getConfigData(){
        return window.terminal._readCharacteristicValue(CONFIG_CHAR_UUID)
      .then(window.terminal._configDataConvert);
    }

    onNotify(event) {
        var characteristic = event.target;

        var hex = '';
        var arr = [];
        for (var i = 0; i < characteristic.value.byteLength; ++i) {
            var hexChar = characteristic.value.getUint8(i).toString(16);
            if (hexChar.length == 1) {
                hexChar = '0' + hexChar;
            }
            hex += hexChar;
            arr.push(characteristic.value.getUint8(i));
        }
        window.terminal.terminaldata = window.terminal.terminaldata + hex;
        window.terminal.updateUI();
    }

    /* Utils */

    _cacheCharacteristic(service, characteristicUuid) {
      return service.getCharacteristic(characteristicUuid).then(function (characteristic) {
        window.terminal.characteristics.set(characteristicUuid, characteristic);
      });
    }

    _readCharacteristicValue(characteristicUuid) {
      var characteristic = window.terminal.characteristics.get(characteristicUuid);
      return characteristic.readValue().then(function (value) {
        value = value.buffer ? value : new DataView(value);
        return value;
      });
    }

    _writeCharacteristicValue(characteristicUuid, value) {
      var characteristic = window.terminal.characteristics.get(characteristicUuid);
      if (window.terminal._debug) {
        console.debug('WRITE', characteristic.uuid, value);
      }
      return characteristic.writeValue(value);
    }

    _configDataConvert(data){
      var value = '';
      for (var i = 0; i < data.byteLength; i++) {
        value = value +''+ data.getUint8(i);
      };
      value = value.trim();
      return value;
    }
  }

  window.terminal = new terminal();

})();

function Util()
{
    this.stringToDecArray = function(str){
        var dec, i;
        var dec_arr = [];
        if(str){
            for (i=0; i<str.length; i++) {
                dec = str.charCodeAt(i).toString(10);
                dec_arr.push(Number(dec));
            }
        }
        return dec_arr;
    };

    this.convertHexStringToNumArray = function(str) {
        var result = [];
        for (var i = 0; i < str.length; i = i+2) {
            result.push(parseInt(str[i]+str[i+1], 16));
        }
        return(result);
    };
    
    return this;
}