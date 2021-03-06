"use strict";

const express = require("express");
const SocketServer = require("ws").Server;
const path = require("path");

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, "index.html");

const server = express()
  .use((req, res) => res.sendFile(INDEX))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new SocketServer({ server, clientTracking: true });

let clients = [];

function disconnectClient(index) {
  clients.splice(index, 1);
}

function returnIndexFromUniqueIdentifier(ws) {
  let clientIndex = 0;
  clients.forEach((client, index) => {
    if (client.uniqueIdentifier == ws.uniqueIdentifier) {
      clientIndex = index;
    }
  });

  return clientIndex;
}

wss.on("connection", function connection(ws, req) {
  ws.uniqueIdentifier = Math.floor(Math.random() * Math.floor(10000000));
  ws.username = "guest";

  ws.onmessage = function(event) {
    let message = JSON.parse(event.data);

    wss.clients.forEach(client => {
      let date = new Date();
      let dateString =
        date.getHours() + ":" + date.getMinutes();
      ws.username = message.username;
      let username = message.username;
      let messageText = username + " " + dateString + ": " + message.text;
      let newMessage = {
        type: "chatMessage",
        text: messageText,
      };

      client.send(JSON.stringify(newMessage));
    }); 
  
  };

  clients.push (ws);

  wss.clients.forEach(client => {
    sendServerMessage(client, "A new user has joined the chat.");
  });

  ws.on ("close", () => {
    wss.clients.forEach(client => {
      sendServerMessage(client, ws.username + " has left the chat.");
    });
    disconnectClient(returnIndexFromUniqueIdentifier(ws));
  });
});

function sendServerMessage(client, messageName) {
  let date = new Date();
  let dateString =
    date.getHours() + ":" + date.getMinutes();
  let messageText = dateString + ": " + messageName;
  let message = {
    type: "serverMessage",
    text: messageText,
  };

  client.send(JSON.stringify(message));
}

function updateClientTime () {
  wss.clients.forEach(client => {
    let date = new Date();
    let dateString =
      date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
    let message = {
      type: "time",
      text: dateString,
    };
  
    client.send(JSON.stringify(message));
  });  
}

function updateOnlineUsers () {
  wss.clients.forEach(client => {
    let messageText = clients.length + " users online";
    let message = {
      type: "onlineUsers",
      text: messageText,
    };
  
    client.send(JSON.stringify(message));
  });   
}

setInterval(() => {
  updateClientTime ();
  updateOnlineUsers ();
}, 1000);
