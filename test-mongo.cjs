const mongoose = require('mongoose');

const uri = "mongodb://nikdel_backend:Mikky_86@ac-w0izwds-shard-00-00.jgexfla.mongodb.net:27017,ac-w0izwds-shard-00-01.jgexfla.mongodb.net:27017,ac-w0izwds-shard-00-02.jgexfla.mongodb.net:27017/?ssl=true&replicaSet=atlas-w0izwds-shard-0&authSource=admin&retryWrites=true&w=majority&appName=nikdel-cluster";

mongoose.connect(uri)
  .then(() => {
    console.log("Connected successfully!");
    process.exit(0);
  })
  .catch(err => {
    console.error("Connection error:", err.message);
    process.exit(1);
  });
