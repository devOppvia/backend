const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const routes = require("./routes/index");
const { errorMiddleware } = require("./middlewares/errorMiddleware");
const cookieParser = require("cookie-parser");
const app = express();
app.use(
  cors({
    origin: [
      // "http://localhost:3001",
      "https://testoppvia.vercel.app",
      "https://oppva.netlify.app",
      "http://192.168.1.187:5173",
      "https://talentoppvia.netlify.app",
      "http://192.168.1.64:5173",
      "http://192.168.1.165:5177",
      "http://localhost:3006",
      "http://localhost:5178",
      "http://localhost:5174",
      "http://192.168.1.165:5177",
      "http://192.168.1.165:3001",
      "http://192.168.1.165:5173",
      "http://192.168.1.162:5177",
      "http://192.168.1.162:5173",
      "http://localhost:3002",
      "http://192.168.1.14:3002",
      "http://localhost:5173",
      "http://192.168.1.14:3000",
      "http://192.168.137.1:3000",
      "http://192.168.1.11:3000",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://192.168.1.11:3001",
      "http://192.168.1.11:5173",
      "http://192.168.1.14:5173",
      "http://172.27.3.199:3000",
      "http://172.27.3.215:5173",
      "http://172.27.3.214:3000",
      "https://oppvia-admin.mykidstoryapp.com",
      "https://oppvia-company.mykidstoryapp.com",
      "https://oppvia-intern.mykidstoryapp.com",
      "http://192.168.1.110:3000",
      "http://192.168.1.113:3000",
      "http://localhost:3300",
      "http://192.168.1.11:3300",
      "http://192.168.1.124:3000",
      "http://192.168.1.11:5177",
      "http://localhost:5177",
      "https://oppvia.in",
      "https://api.oppvia.in",
      "https://admin.oppvia.in",
      "https://talent.oppvia.in",
      "https://recruiter.oppvia.in",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposedHeaders: ["Set-Cookie"],
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(morgan("dev"));
app.get("/" ,(req,res) => res.send("Hello....."))

app.use("/api/v1", routes);

app.use(errorMiddleware);

module.exports = app;
