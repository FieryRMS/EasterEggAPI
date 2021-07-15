const http = require("http");
const app = require("./app");
const db = require("./api/libs/db")
const port = parseInt(process.env.PORT) || 3000;
const server = http.createServer(app);
server.listen(port);
db.EventEmitter.once("StartShutdown",()=>{
    server.close(() => {
        console.log('Process terminated');
    })
})