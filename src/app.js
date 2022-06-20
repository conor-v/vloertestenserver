const express = require("express");
const path = require("path");
const { instrument } = require("@socket.io/admin-ui");

const app = express();
http = require("http").Server(app);
// setup socket.io
const io = require("socket.io")(http);

// Setup admin page for Socket.io
instrument(io, {
  auth: false,
  namespaceName: "/",
});

app.use(express.json());
app.use(express.static("public"));

// setup admin route for socket.io admin
app.get("/admin", function (req, res) {
  res.sendFile(path.join(__dirname, "../public/ui", "index.html"), function (err) {
    if (err) {
      res.status(500).send(err);
    }
  });
});

// make all paths redirect to index.html (needed for react app with react-router)
app.get("/*", function (req, res) {
  res.sendFile(path.join(__dirname, "../public", "index.html"), function (err) {
    if (err) {
      res.status(500).send(err);
    }
  });
});

// Main connection for socket.io
io.on("connection", function (socket) {
  console.log("connected");
  socket.on("room", (room) => {
    socket.join(room);
  });

  socket.on("room change", (data, callback) => {
    socket.leave(data.currentRoom);
    socket.join(data.newRoom);
    callback(data.newRoom);
  });

  // All events sent from client to server
  // socket.broadcast.to emits to all in the room, except for the client that sent the event --> https://socket.io/docs/v4/#broadcasting
  // io.to emits to all in the room, the client that sent the event included --> https://socket.io/docs/v4/rooms/#joining-and-leaving
  socket.on("camera change", (data) => {
    socket.broadcast.to(Array.from(socket.rooms)[1]).emit("camera change", data);
  });

  socket.on("active", (data) => {
    socket.broadcast.to(Array.from(socket.rooms)[1]).emit("active", data);
  });

  socket.on("configurator change", (data, room) => {
    io.to(room).emit("configurator change", data);
  });
  socket.on("configvalue change", (data) => {
    socket.broadcast.to(Array.from(socket.rooms)[1]).emit("configvalue change", data);
    socket.broadcast.to(Array.from(socket.rooms)[1]).emit("active", data)
  });
  socket.on("picture change", (data) => {
    socket.broadcast.to(Array.from(socket.rooms)[1]).emit("picture change", data);
  });
  socket.on("store change", ({ object, field, value }) => {
    socket.broadcast.to(Array.from(socket.rooms)[1]).emit("store change", { object, field, value });
  });

  socket.on("selecteded floor", (obj) => {
    socket.broadcast.to(Array.from(socket.rooms)[1]).emit("selecteded floor", { obj });
    socket.broadcast.to(Array.from(socket.rooms)[1]).emit("active", {obj})
  });

  socket.on("get floors", (floors) => {
    socket.broadcast.to(Array.from(socket.rooms)[1]).emit("get floors", {floors});
    console.log('vloeren', floors);
    socket.broadcast.to(Array.from(socket.rooms)[1]).emit("active", floors)
  });

  socket.on("get meters", (meters) => {
    socket.broadcast.to(Array.from(socket.rooms)[1]).emit("get meters", { meters });
  });

  socket.on("disconnect", function () {
    console.log("A user disconnected");
  });
});

module.exports = http;
