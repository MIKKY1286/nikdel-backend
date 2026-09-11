const dns = require('dns');
dns.resolveSrv('_mongodb._tcp.nikdel-cluster.jgexfla.mongodb.net', (err, addresses) => {
  if (err) console.error(err);
  else console.log(addresses);
});
