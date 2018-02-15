// Load required modules
var http    = require("http");              // http server core module
var express = require("express");           // web framework external module
var serveStatic = require('serve-static');  // serve static files
var socketIo = require("socket.io");        // web socket external module
var easyrtc = require("easyrtc");               // EasyRTC external module

// Add request module to call XirSys servers
var request = require("request");


// Set process name
process.title = "node-easyrtc";

// Get port or default to 8080
var port = process.env.PORT || 8080;

// Setup and configure Express http server. Expect a subfolder called "static" to be the web root.
var app = express();
app.use(serveStatic('server/static', {'index': ['index.html']}));

// Start Express http server
var webServer = http.createServer(app);

// Start Socket.io so it attaches itself to Express server
var socketServer = socketIo.listen(webServer, {"log level":1});

var myIceServers = [
 /*
  {"url":"stun:stun.l.google.com:19302"},
  {"url":"stun:stun1.l.google.com:19302"},
  {"url":"stun:stun2.l.google.com:19302"},
  {"url":"stun:stun3.l.google.com:19302"},
  {"url":"stun:e3.xirsys.com"},
  {
     "url":"turn:e3.xirsys.com:80?transport=udp",
     "username":"0f3abad0-129d-11e8-ab19-7ea9449ec310",
     "credential":"0f3abb8e-129d-11e8-8209-8f7a81465677"
  },
  {
     "url":"turn:e3.xirsys.com:3478?transport=udp",
     "username":"0f3abad0-129d-11e8-ab19-7ea9449ec310",
     "credential":"0f3abb8e-129d-11e8-8209-8f7a81465677"
  },
  {
     "url":"turn:e3.xirsys.com:3478?transport=udp",
     "username":"0f3abad0-129d-11e8-ab19-7ea9449ec310",
     "credential":"0f3abb8e-129d-11e8-8209-8f7a81465677"
  },  
  {
     "url":"turn:e3.xirsys.com:3478?transport=tcp",
     "username":"0f3abad0-129d-11e8-ab19-7ea9449ec310",
     "credential":"0f3abb8e-129d-11e8-8209-8f7a81465677"
  },  
  {
     "url":"turns:e3.xirsys.com:443?transport=tcp",
     "username":"0f3abad0-129d-11e8-ab19-7ea9449ec310",
     "credential":"0f3abb8e-129d-11e8-8209-8f7a81465677"
  },  
  {
     "url":"turns:e3.xirsys.com:5349?transport=tcp",
     "username":"0f3abad0-129d-11e8-ab19-7ea9449ec310",
     "credential":"0f3abb8e-129d-11e8-8209-8f7a81465677"
  }*/
  // {
  //   "url":"turn:[ADDRESS]:[PORT]",
  //   "username":"[USERNAME]",
  //   "credential":"[CREDENTIAL]"
  // },
  // {
  //   "url":"turn:[ADDRESS]:[PORT][?transport=tcp]",
  //   "username":"[USERNAME]",
  //   "credential":"[CREDENTIAL]"
  // }
];
//easyrtc.setOption("appIceServers", myIceServers);
easyrtc.setOption("logLevel", "debug");
//easyrtc.setOption("demosEnable", false);

easyrtc.on("getIceConfig", function(connectionObj, callback) {
    var httpreq = https.request(options, function(httpres) {
        var str = "";
        httpres.on("data", function(data){ str += data; });
        httpres.on("error", function(e){ console.log("error: ",e); });
        httpres.on("end", function(){ 
            var d = JSON.parse(str);
            if(d.s == 'ok'){
                var iceConfig = d.v.iceServers;
                console.log('server list: ',iceConfig);
                callback(null, iceConfig);
            }
        });
    });
    httpreq.end();
});



// Overriding the default easyrtcAuth listener, only so we can directly access its callback
easyrtc.events.on("easyrtcAuth", function(socket, easyrtcid, msg, socketCallback, callback) {
    easyrtc.events.defaultListeners.easyrtcAuth(socket, easyrtcid, msg, socketCallback, function(err, connectionObj){
        if (err || !msg.msgData || !msg.msgData.credential || !connectionObj) {
            callback(err, connectionObj);
            return;
        }

        connectionObj.setField("credential", msg.msgData.credential, {"isShared":false});

        console.log("["+easyrtcid+"] Credential saved!", connectionObj.getFieldValueSync("credential"));

        callback(err, connectionObj);
    });
});

// To test, lets print the credential to the console for every room join!
easyrtc.events.on("roomJoin", function(connectionObj, roomName, roomParameter, callback) {
    console.log("["+connectionObj.getEasyrtcid()+"] Credential retrieved!", connectionObj.getFieldValueSync("credential"));
    easyrtc.events.defaultListeners.roomJoin(connectionObj, roomName, roomParameter, callback);
});

// Start EasyRTC server
var rtc = easyrtc.listen(app, socketServer, null, function(err, rtcRef) {
    console.log("Initiated");

    rtcRef.events.on("roomCreate", function(appObj, creatorConnectionObj, roomName, roomOptions, callback) {
        console.log("roomCreate fired! Trying to create: " + roomName);

        appObj.events.defaultListeners.roomCreate(appObj, creatorConnectionObj, roomName, roomOptions, callback);
    });
});

//listen on port
webServer.listen(port, function () {
  console.log('listening on http://localhost:' + port);
});

var https = require("https");
var options = {
      host: "global.xirsys.net",
      path: "/_turn/MyFirstApp",
      method: "PUT",
      headers: {
          "Authorization": "Basic " + new Buffer("jawatr:864c3d40-129a-11e8-8b8f-486c07ca5853").toString("base64")
      }
};
