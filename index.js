const { token } = process.env;
const { ClusterManager } = require("discord-hybrid-sharding");
const c = require("ansi-colors");

const manager = new ClusterManager("./bot.js", {
	totalShards: "auto", // or 'auto
	shardsPerClusters: 5,
	mode: "worker", // you can also choose "worker"
	token: token
});

manager.on("clusterCreate", (cluster) => console.log(`Launched Cluster ${cluster.id}`));
manager.spawn({ timeout: -1 });