const express = require("express");
const server = express();

server.use('/', (req, res) => {
  res.send("Movie Bot is ready!");
})

function keepAlive() {
  server.listen(3000, () => {
    console.log("Server is Ready!!")
  })
}

module.exports = keepAlive;