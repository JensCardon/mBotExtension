define(function (require) {
    function HID(){
        const self = this;
        const EventEmitter = require("../events/emitter.js");
        const DeviceEvent = require("../events/deviceevent.js");
        self.connectionIds = [];
        self.emitter = new EventEmitter();
        self.buffer = [];
        self.devices = [];
        self.port = chrome.runtime.connect({name: "hid"});
        var i=0;
        var connectedDevices = 0;
        function updateHandle(msg){
            switch(msg.event){
                case DeviceEvent.DEVICE_ADDED:{
                    for(i=0;i<self.devices.length;i++){
                        if(self.devices[i].deviceId==msg.device.deviceId){
                            return;
                        }
                    }
                    self.devices.push(msg.device);
                    self.emitter.emit(DeviceEvent.DEVICES_UPDATE,self.devices);
                }
                break;
                case DeviceEvent.DEVICE_REMOVED:{
                    for(i=0;i<self.devices.length;i++){
                        if(self.devices[i].deviceId==msg.deviceId){
                            self.devices.splice(i,1);
                        }
                    }
                    self.emitter.emit(DeviceEvent.DEVICES_UPDATE,self.devices);
                }
                break;
                case DeviceEvent.DATA_RECEIVED:{
                    self.emitter.emit(DeviceEvent.DATA_RECEIVED,msg.data);
                }
                break;
                case DeviceEvent.COMMAND_RECEIVED:{
                    var data = msg.data;
                    data.splice(0,1);
                    self.send(data);
                }
                break;
            }
        }
        self.port.onMessage.addListener(updateHandle);
        self.list = function(){
            return new Promise(((resolve)=>{
                function received(msg){
                    self.port.onMessage.removeListener(received);
                    self.devices = msg.devices;
                    resolve(msg.devices);
                }
                self.port.onMessage.addListener(received);
                self.port.postMessage({method:"list"});
            }));
        };
        self.connect = function(deviceId){
          console.log("in connect");
          var connectionId;
          return new Promise(((resolve)=>{
            console.log("in Promise");
              function received(msg){
                console.log("msg.method: " + msg.method + " deviceId: " + deviceId);
                  self.port.onMessage.removeListener(received);
                  connectionId = msg.connectionId;
                  console.log("connectionIds-before: " + self.connectionIds);
                  self.connectionIds.push(connectionId);
                  console.log("connectionIds-after: " + self.connectionIds);
                  var suc = self.connectionIds.length != 0;
                  resolve(suc);
                  if(suc){
                    self.poll();
                    console.log("deviceId: " + deviceId + "; msg.connectionId: " + msg.connectionId);
                  }
              }
              self.port.onMessage.addListener(received);
              self.port.postMessage({method:"connect",deviceId:deviceId});
            }));
        };
        self.disconnect = function(){
            return new Promise(((resolve)=>{
              function received(msg){
                  self.port.onMessage.removeListener(received);
                  self.connectionIds = [];
                  resolve();
              }
              self.port.onMessage.addListener(received);
              if(self.connectionIds.length != 0){
                for (var i = 0; i < self.connectionIds.length; i++){
                self.port.postMessage({method:"disconnect",connectionId:self.connectionIds[i]});
                }
              }else{
                resolve();
              }
            }));
        };
        self.poll = function(){
          for (var i = 0; i < self.connectionIds.length; i++){
            self.port.postMessage({method:"poll",connectionId:self.connectionIds[i]});
          }
        };
        self.send = function(data){
            return new Promise(((resolve)=>{
                function received(){
                  self.port.onMessage.removeListener(received);
                  resolve();
              }
              self.port.onMessage.addListener(received);
              self.port.postMessage({method:"send",connectionId:self.connectionIds[0],data:data});
            }));
        };
        self.on = function(event,listener){
            self.emitter.on(event,listener);
        };
        
        self.list();
        /**/
    }
    return HID;
});