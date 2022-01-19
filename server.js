const express = require("express");
const http = require("http");
var SSHClient = require("ssh2").Client;
var utf8 = require("utf8");
const app = express();
var serverPort = 4000;
var server = http.createServer(app);

//set the template engine ejs
app.set("view engine", "ejs");

//middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let host = "";
let user = "";
let password = "";
let port = "";

//routes
app.get("/", (req, res) => {
  res.render("form");
});

app.post("/ssh", (req, res) => {
  host = req.body.host;
  user = req.body.username;
  password = req.body.password;
  port = req.body.port;
  res.render("index");
});
server.listen(process.env.PORT||serverPort);

//socket.io instantiation
const io = require("socket.io")(server);


//Socket Connection

io.on("connection", function(socket) {
  console.log("New client connected");
  var ssh = new SSHClient();
  ssh
    .on("ready", function() {
      socket.emit("data", "\r\nSSH CONNECTION ESTABLISHED\r\n");
      connected = true;
      ssh.shell(function(err, stream) {
        if (err)
          return socket.emit(
            "data",
            "\r\nSSH SHELL ERROR: " + err.message + "\r\n"
          );
        socket.on("data", function(data) {
          stream.write(data);
        });
        stream
          .on("data", function(d) {
            socket.emit("data", utf8.decode(d.toString("binary")));
          })
          .on("close", function() {
            ssh.end();
          });
      });
    })
    .on("close", function() {
      console.log("Connection closed");
      socket.emit("data", "\r\nSSH CONNECTION CLOSED\r\n");
      socket.emit("redirect", "/");
    })
    .on("error", function(err) {
      console.log(err);
      socket.emit(
        "data",
        "\r\nSSH CONNECTION ERROR: " + err.message + "\r\n"
      );
    })
    .connect({
      host: host,
      port: port, // Generally 22 but some server have diffrent port for security Reson
      username: user, // user name
      password: password // Set password or use PrivateKey
      // privateKey: require("fs").readFileSync("PATH OF KEY ") // <---- Uncomment this if you want to use privateKey ( Example : AWS )
    });
});
