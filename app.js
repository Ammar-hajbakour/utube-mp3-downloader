const express = require("express");
const app = express();
require("dotenv").config();
const fileUpload = require("express-fileupload");
const fs = require("fs");
const fsx = require("fs-extra");
const fetch = require("node-fetch");

const path = require("path");

const { spawn } = require("child_process");

const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir:"/tmp/",
  })
);

app.get("/", (req, res) => {
  res.render("index", { loading: false });
});
const data = {
  success: false,
  loading: false,
  message: ''
}
app.post("/process", async (req, res) => {
  const file = req.files.music;
  
  if (!req.files || !file) {
    return res.render("index", {...data, message: "No file uploaded" });
  }
  const _file = path.join(__dirname,"tmp",file.name)
  file.mv(_file, (err) => {
    if (err)
      return res.render("index", {
        ...data, loading: false,
        message: `File Upload Error : ${err.message}`,
      });
  });
  const fileName = file.name.slice(0, -4);

  const filePath = path.join(__dirname,"tmp");
  const inputFilePath = path.join(filePath, file.name);

  const outputFileName = new Date() + "-separated_sound";
  const outputDir = path.join(__dirname,"output");
  const outputFilePath = path.join(outputDir, outputFileName);
  const outputVocalsPath = path.join(outputFilePath, fileName);
  const vocalsFile = path.join(outputVocalsPath, "vocals.mp3");

  if(fs.existsSync(inputFilePath)){
    fs.unlink(inputFilePath, (err) => {
      if (err) console.error(err.message);
    })
  }
  if(fs.existsSync(outputFilePath)){
    deleteDirectory(outputFilePath);
  }

  
  // pip install spleeter
 
  const pythonScript = `
import os
from spleeter.separator import Separator
input_file = os.path.abspath("${inputFilePath}")
output_dir = os.path.abspath("${outputFilePath}")
separator = Separator('spleeter:2stems')
separator.separate_to_file(input_file, output_dir, codec='mp3')
`;

  const pythonProcess = spawn("python", ["-c", pythonScript]);

  pythonProcess.stdout.on("data", (data) => {
    console.error(data);
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(data);
  });

  pythonProcess.on("close", (code) => {
    res.download(vocalsFile, (err) => {
      if (err) {
        console.error(err.message);
        res.render("index", {
          ...data, loading: false,
          message: `File downloading Error : ${err.message}`,
        });
        
        if(fs.existsSync(inputFilePath)){
          fs.unlink(inputFilePath, (err) => {
            if (err) console.error(err.message);
          })
        }
      }
      if(fs.existsSync(inputFilePath)){
        fs.unlink(inputFilePath, (err) => {
          if (err) console.error(err.message);
        })
      }
      if(fs.existsSync(outputFilePath)){
        deleteDirectory(outputFilePath);
      }
    });
  });
});

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

async function deleteDirectory(directoryPath) {
  try {
    await fsx.remove(directoryPath);
    console.log(`Directory deleted: ${directoryPath}`);
  } catch (error) {
    console.error("Error deleting directory:", error);
  }
}
