require("dotenv").config()
const app = require("./app")
const path = require("path")
const fs = require("fs")
const http = require("http")
const { initSocket} = require("./socket/socket")
const { startRealtimeServer } = require("./socket/openAirealtime")
const { startInterviewRealtimeServer } = require("./socket/interviewXRealtime")
const PORT = process.env.PORT || 8008;
// require("./jobs/companyVerification")
require("./jobs/CronJob")
require("./jobs/resetLimitCount")
require("./jobs/aiCallRetry.job");
const server = http.createServer(app)
initSocket(server)

app.get("/", (req, res)=>{
    res.send("🚀🚀 Oppvia Api is Running 🚀🚀")
})


app.get("/api/v1/get-images/:image_path", (req,res)=>{
    let { image_path } = req.params || {}
    if(!image_path){
        return res.status(400).json({
            status : false,
            message : "Image path is required"
        })
    }
    const fullPath = path.join(__dirname, "../uploads", image_path)
    try {
        if(!fs.existsSync(fullPath)){
            return res.status(400).json({ status : false, message : "Image not found"})
        }
        return res.status(200).sendFile(fullPath)
    } catch (error) {
        return res.status(500).json({ status : false, message : "Image not found"})
    }
})


app.get("/api/v1/get-email-templates/:template_path", (req,res)=>{
    let { template_path } = req.params || {}
    if(!template_path){
        return res.status(400).json({
            status : false,
            message : "Template path is required"
        })
    }
    const fullPath = path.join(__dirname, "../emailMedia", template_path)
    try {
        if(!fs.existsSync(fullPath)){
            return res.status(400).json({ status : false, message : "Template not found"})
        }
        return res.status(200).sendFile(fullPath)
    }catch (error) {
        return res.status(500).json({ status : false, message : "Template not found"})
    }
})

startRealtimeServer(server);
startInterviewRealtimeServer(server);

server.listen(PORT, ()=>{
    console.log(`Server is running on port http://localhost:${PORT}`);
})