define(function (require) {
  const Serial = require("./libs/hardware/serial.js");
  const HID = require("./libs/hardware/hid.js");
  const Bluetooth = require("./libs/hardware/bluetooth.js");
  const DeviceEvent = require("./libs/events/deviceevent.js");
  const Vue = require("./libs/ui/vue.js");
  // var port = new Serial();
  // port.list().then(function(ports){
  //     console.log("serial ports:",ports);
  // });
  //ogpaopffkincgenkbbiedlfleljflfkf
  console.log("id:",chrome.runtime.id);
  const self = this;
  var hid = new HID();
  var hids = [];
  var serial = new Serial();
  var bluetooth = new Bluetooth();
  var app = new Vue({
    el: '#app',
    data: {
      logo:"./assets/logo.png",
      mbot:"./assets/mBot.jpg"
    },
    methods: {
      mbotSelected: function () {
        console.log("mbot");
      },
      rangerSelected: function () {
        console.log("ranger");
      }
    }
  });

  function connect(devices){
    if(devices.length == 0){
      console.log("no devices found");
    } 
    else {
      for(var i=devices.length-1; i >= 0 ; i--){
        var device_id = devices[i].value;
        function checkConnected(hid){
          return hid.deviceId == device_id;
        }
      //connect device if not already connected
      if(hids.find(checkConnected) === undefined){
        var hid = new HID(device_id);
        hid.connect(device_id);
        hids.push(hid);

        //add to HID connected
        var connected_options = hidDisconnected._data.connected_options;
        connected_options.push({ text: devices[i].text, value: device_id });
        hidDisconnected._data.connected_options = connected_options;

        //remove options from HID disconnected
        function findID(obj){
          return obj.value == device_id;
        }
        var disconnected_options = devices;
        var index = disconnected_options.findIndex(findID);
        if(index > -1){
          disconnected_options.splice(index, 1);
        } 
        else {
          console.log("something horrible went wrong ==> this shouldn't happen");
        }
        console.log("Device with id:" + device_id + " connected");
      }
      else {
        console.log("Device with id:" + device_id + " already connected ==> this shouldn't happen");
      }
    }
  }
};

function removeElements(values, array){
  for(var i = 0; i<values.length; i++){
    function find(obj){
      return obj.value == values[i].value;
    }
    index = array.findIndex(find);
    if(index != -1){
      array.splice(index, 1);
    }
  }
  return array;
}

function remove_Disconnect_Elements(values, array){
  for(var i = 0; i<values.length; i++){
    function find(obj){
      return obj.value == values[i].value;
    }
    index = array.findIndex(find);
    if(index != -1){
      obj.disconnect();
      array.splice(index, 1);
    }
  }
  return array;
}

var hid_connected = Vue.component('hid_connected', {
  props: {
    connected_selected: 
    { type: Array,
      default: function () { return [] }
    },
    connected_options: 
    {  type: Array,
      default: function () { return [] }
    }
  },

  template: '#connected-template',

  data: function () {
    return data
  }
});

var hidDisconnected = new Vue({
  el: '#hid_disconnected',
  components: {hid_connected: hid_connected},
  data: {
    selected: [],
    options: [],
    connected_options: [],
    connected_selected: []
  },
  methods: {
    connect_all: function(e) {
      if(this.options.length != 0){
        connect(this.options);
        this.options = [];
        this.selected = [];
      } else {
        console.log("no disconnected devices found");
      }
    },
    connect_selected: function(e){
      if(this.selected.length != 0){
        this.options = removeElements(this.selected, this.options);
        connect(this.selected);
        this.selected = [];
      } else {
        console.log("no disconnected devices selected");
      }
    },
    disconnect_all: function(e){
      var connected_options = this.connected_options;
      if(connected_options.length != 0){
        for(var i=0; i<connected_options.length; i++){
          hids[i].disconnect();
          this.options.push(connected_options[i]);
        }
        this.connected_options = []; 
        this.connected_selected = [];
        hids = [];
      } else {
        console.log("no connected devices found");
      }
    },
    disconnect_selected: function(e){
      if(this.connected_selected.length != 0){
        for(var i = 0; i<this.connected_selected.length; i++){
          var connected_selected = this.connected_selected[i];
          var device_id = connected_selected.value;
          hids = remove_Disconnect_Elements([new HID(device_id)], hids);
          this.options.push(connected_selected);
        }
        this.connected_options = removeElements(this.connected_selected, this.connected_options);
        this.connected_selected = [];
      } else {
        console.log("no connected devices selected")
      }
    }
  }
});

var serialSelector = new Vue({
  el: '#serial-devices',
  data: {
    selected: '',
    options: []
  },
  methods: {
    connect: function (e) {
      if(serial.connectionId>-1){
        serial.disconnect().then(function(){
          e.target.innerHTML = "Connect";
        })
      }else{
        serial.connect(this.selected).then(function(suc){
          console.log("serial connected:",suc);
          e.target.innerHTML = (suc?"Disconnect":"Connect");
        });
      }
    }
  }
});

var bluetoothSelector = new Vue({
  el: '#bluetooth-devices',
  data: {
    selected: '',
    options: []
  },
  methods: {
    connect: function (e) {
      if(bluetooth.connectionId == []){
        bluetooth.disconnect().then(function(){
          e.target.innerHTML = "Connect";
        })
      }else{
        bluetooth.connect(this.selected).then(function(suc){
          console.log("bluetooth connected:",suc);
          e.target.innerHTML = (suc?"Disconnect":"Connect");
        });
      }
    },
    discover:function(e){
      bluetooth.discover();
    }
  }
});
var scratchPanel = new Vue({
  el:"#scratch-x-panel",
  methods:{
    openProject:function(){
      window.open('http://scratchx.org/?url=https://jenscardon.github.io/mBotExtension/src/extensions/mbot/mbot.js&id='+chrome.runtime.id+'#scratch');
      //window.open('http://scratchx.org/?url=http://mbotx.github.io/scratchx-mbot/makeblock.js&id='+chrome.runtime.id+'#scratch');
      },
      refresh:function(){
        updateSerial();
        updateHID();
        bluetooth.discover();
      }
    }
  });
function updateSerial(){
  serial.list().then(function(devices){
    updateSerialList(devices);
  });
}
function updateHID(){
  //console.log("-----------updateHID------------");
  hid.list().then(function(devices){
  //if device removed
  if(devices.length<prev_devices.length){
    //get the removed devices
    var removed = removeElements(devices, prev_devices);
    //remove them from connected selected
    // console.log("devices:");
    // console.log(devices);
    // console.log("removed:");
    // console.log(removed);
    // console.log("connected_options before");
    // console.log(hidDisconnected._data.connected_options);
    // hidDisconnected._data.connected_options = removeElements(removed, hidDisconnected._data.connected_options);
    // console.log("connected_options after");
    // console.log(hidDisconnected._data.connected_options);
  } 
  updateHIDList(devices);
  prev_devices = devices.slice();
  //console.log("prev_devices:");
  //console.log(prev_devices);
  //console.log("-----------updateHID-end---------");
});
}
function updateBluetooth(){
  bluetooth.list().then(function(devices){
    updateBluetoothList(devices);
  });
}
var prev_devices = [];
updateSerial();
updateHID();
updateBluetooth();
hid.on(DeviceEvent.DEVICES_UPDATE,function(devices){
  console.log("hid.on");
  updateHID();
});
bluetooth.on(DeviceEvent.DEVICES_UPDATE,function(devices){
  updateBluetoothList(devices);
});
function updateHIDList(devices){
  var options = [];
  for(var i=0;i<devices.length;i++){
    options.push({ text: devices[i].productName + " " + devices[i].deviceId, value: devices[i].deviceId });
  }
  //add devices to disconnected options
  hidDisconnected._data.options = options;
}
function updateSerialList(devices){
  var options = [];
  for(var i=0;i<devices.length;i++){
    if(devices[i].path.indexOf("cu")>-1)continue;
    options.push({ text: devices[i].path, value: devices[i].path });
  }
  serialSelector._data.options = options;
  if(options.length>0){
    serialSelector._data.selected = options[0].value;
  }
}
function updateBluetoothList(devices){
  var options = [];
  for(var i=0;i<devices.length;i++){
    options.push({ text: devices[i].name+"("+devices[i].address+")", value: devices[i].address });
  }
  bluetoothSelector._data.options = options;
  if(options.length>0){
    bluetoothSelector._data.selected = options[0].value;
  }
}
});
//clgdmbbhmdlbcgdffocenbbeclodbndh
//old code
function onRefreshHardware(){
  console.log("main: in onRefreshHardware");
  var msg = {};
  msg.action = "initHID";
  chrome.runtime.sendMessage(msg,function(response){
    console.log("initHID:",response);
    msg.action = "initSerial";
    chrome.runtime.sendMessage(msg,function(response){
      console.log("initSerial:",response);
      msg.action = "initBT";
      chrome.runtime.sendMessage(msg,function(response){
        console.log("initBT:",response);
      });
    });
  });
  
}
function onConnectSerial(){
  var msg = {};
  msg.action = document.getElementById('connectSerial').innerHTML=="Connect"?"connectSerial":"disconnectSerial";
  msg.deviceId = document.getElementById('serial-device-selector').options[document.getElementById('serial-device-selector').selectedIndex].id;
  chrome.runtime.sendMessage(msg,function(response){
    console.log("serial:",response);
    
  });
}
function onConnectBT(){
  var msg = {};
  msg.action = document.getElementById('connectBT').innerHTML=="Connect"?"connectBT":"disconnectBT";
  msg.address = document.getElementById('bt-device-selector').options[document.getElementById('bt-device-selector').selectedIndex].id;
  chrome.runtime.sendMessage(msg,function(response){
    console.log("bt:",response);
  });
}
function onMessage(request, sender, sendResponse){
  console.log("onMessage");
  var option,i;
  if(request.action=="initHID"){
    if(request.deviceId!==''){
      console.log(request.devices);
      option = document.createElement('option');
      option.text = request.productName+" #"+request.deviceId;
      option.id = request.deviceId;
      document.getElementById('hid-device-selector').options.length = 0;
      document.getElementById('hid-device-selector').options.add(option);
    }
  }else if(request.action=="addHID"){
    if(request.deviceId!==''){
      option = document.createElement('option');
      option.text = request.productName+" #"+request.deviceId;
      option.id = request.deviceId;
      document.getElementById('hid-device-selector').options.add(option);
    }
  }else if(request.action=="initBT"){
    document.getElementById('bt-device-selector').options.length = 0;
    console.log(request.devices);
    if(request.devices.length>0){
      for(i=0;i<request.devices.length;i++){
        option = document.createElement('option');
        option.text = ""+request.devices[i].name+" ( "+request.devices[i].address+" )";
        option.id = request.devices[i].address;
        document.getElementById('bt-device-selector').options.add(option);
      }
    }
  }else if(request.action=="initSerial"){
    document.getElementById('serial-device-selector').options.length = 0;
    if(request.devices.length>0){
      for(i=0;i<request.devices.length;i++){
        option = document.createElement('option');
        option.text = ""+request.devices[i].path+(request.devices[i].displayName?" "+request.devices[i].displayName:"");
        option.id = request.devices[i].path;
        document.getElementById('serial-device-selector').options.add(option);
      }
    }
  }else if(request.action=="connectHID"){
    document.getElementById('connectHID').innerHTML = request.status?'Disconnect':'Connect';
  }else if(request.action=="connectBT"){
    document.getElementById('connectBT').innerHTML = request.status?'Disconnect':'Connect';
  }else if(request.action=="connectSerial"){
    console.log(request.action,request);
    document.getElementById('connectSerial').innerHTML = request.status?'Disconnect':'Connect';
  }
  var resp = {};
  resp.request = request;
  sendResponse(resp);
}
window.onload = function(){
  console.log("main: in onload");
  document.getElementById('openscratchx').addEventListener('click', onOpenScratchX);
  document.getElementById('connectSerial').addEventListener('click', onConnectSerial);
  document.getElementById('connectBT').addEventListener('click', onConnectBT);
  document.getElementById('refresh').addEventListener('click', onRefreshHardware);
  chrome.runtime.onMessage.addListener(onMessage);
  onRefreshHardware();
};
