const express = require("express");
const app = express();
require("dotenv").config();
const fs = require("fs");
const fsx = require("fs-extra");
const fetch = require("node-fetch");
const fileUpload = require("express-fileupload");
const multer = require("multer");
const path = require("path");

const { spawn } = require("child_process");
const { renderFile } = require("ejs");

const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


const data = {
  success: undefined,
  loading: false,
  message: "",
  video_title: "",
  video_link: "",
};

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

// const storage = multer.diskStorage({
//   destination: `${__dirname}/tmp/`,
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
//     cb(null,  uniqueSuffix +"-" +file.originalname )
//   }
// })
// const upload = multer({ storage:storage })

app.get("/", (req, res) => {
  res.render("index", { ...data });
});

// ,upload.single('music')
app.post("/process", (req, res) => {
  // const file = req.file
  const file = req.files.music;
  if (!file) {
    return res.render("index", { ...data, message: "No file uploaded" });
  }
  const _file = path.join(__dirname, "tmp", file.name);
  file.mv(_file, (err) => {
    if (err)
      return res.render("index", {
        ...data,
        loading: false,
        message: `File Upload Error : ${err.message}`,
      });
  });
  // const fileName = file.filename.slice(0, -4);
  const fileName = file.name.slice(0, -4);

  const filePath = path.join(__dirname, "tmp");
  // const inputFilePath = path.join(filePath, file.filename);
  const inputFilePath = path.join(filePath, file.name);

  const outputFileName = new Date().toISOString() + "-separated_sound";
  const outputDir = path.join(__dirname, "output");
  const outputFilePath = path.join(outputDir, outputFileName);
  const outputVocalsPath = path.join(outputFilePath, fileName);
  const vocalsFile = path.join(outputVocalsPath, "vocals.mp3");
  const musicFile = path.join(outputVocalsPath, "accompaniment.mp3");
  const spleeterPath = path.join(__dirname, 'node_modules', 'spleeter', 'bin', 'macos', 'spleeter');
  const spleeterProcess = spawn('spleeter', ['separate', '-i', inputFilePath, '-p', 'spleeter:2stems', '-o', outputFilePath]);
  // const pythonProcess = spawn("python3", [
  //   path.join(__dirname, 'separate.py'),
  //   inputFilePath,
  //   outputFilePath,
  // ]);

  spleeterProcess.stdout.on("data", (data) => {
    console.error(data.toString());
  });

  spleeterProcess.stderr.on("data", (data) => {
    console.error(data.toString());
  });
  spleeterProcess.on("close", async (code) => {
    if (!fs.existsSync(vocalsFile)) {
      if (fs.existsSync(inputFilePath)) fs.unlinkSync(inputFilePath);
      return res.render("index", {
        ...data,
        loading: false,
        success: false,
        message: `File Generating Error : Code = ${code}`,
      });
    } else {
      const vocalDownloader = downloadFile(res, vocalsFile);
      const {status,message} = vocalDownloader
      if (status === "failed") {
        if (fs.existsSync(inputFilePath))
          fs.unlink(inputFilePath, (err) => {
            if (err) console.log(err.message);
          });
        return res.render("index", {
          ...data,
          loading: false,
          success: false,
          message: message,
        });
      } else {
        if (fs.existsSync(inputFilePath))
          fs.unlink(inputFilePath, (err) => {
            if (err) console.log(err.message);
          });
        if (fs.existsSync(outputFilePath))
          fsx.remove(outputFilePath, (err) => {
            if (err) console.log(err.message);
          });
      }
    }
  });
});
function downloadFile(res, filePath) {
  let result = {
    status: "success",
    message: `Vocal file downloaded successfully.`,
  };
  res.download(path.resolve(filePath), (err) => {
    if (err) {
      result = {
        status: "failed",
        message: `File downloading Error : ${err.message}`,
      };
    }
  });
  return result;
}

app.post("/convert-mp3", async (req, res) => {
  const videoUrl = req.body.videoUrl;
  let regex = /v=([^&]+)/;
  let match = videoUrl.match(regex);
  let videoId;
  match ? (videoId = match[1]) : "";
  if (!match) {
    match = videoUrl.lastIndexOf(".be/");
    videoId = match > -1 ? videoUrl.substring(match + 4) : "";
  }
  if (!videoId || videoId.length === 0)
    return res.render("index", {
      ...data,
      message: "Video url is not correct",
    });
  else {
    const fetchApi = await fetch(`${process.env.API_URL}?id=${videoId}`, {
      method: "GET",
      headers: {
        "x-rapidapi-key": process.env.API_KEY,
        "x-rapidapi-host": process.env.API_HOST,
      },
    });
    const response = await fetchApi.json();
    if (response.status === "ok") {
      return res.render("index", {
        ...data,
        success: true,
        video_title: response.title,
        video_link: response.link,
      });
    } else
      return res.render("index", {
        ...data,
        message: response.message,
      });
  }
});

app.listen(PORT, () => console.log("Server listening on port " + PORT));
