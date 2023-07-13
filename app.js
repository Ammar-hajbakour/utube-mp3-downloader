const express = require("express");
const app = express();
require("dotenv").config();
// const fileUpload = require("express-fileupload");
const fs = require("fs");
const fsx = require("fs-extra");
const fetch = require("node-fetch");
const multer = require('multer')
const path = require("path");

const { spawn } = require("child_process");
const { renderFile } = require("ejs");

const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// app.use(
//   fileUpload({
//     useTempFiles: true,
//     tempFileDir:"/tmp/",
//   })
// );

const storage = multer.diskStorage({
  destination: `${__dirname}/tmp/`,
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null,  uniqueSuffix +"-" +file.originalname )
  }
})
const upload = multer({ storage:storage })

app.get("/",(req, res) => {
  res.render("index", { loading: false });
});
const data = {
  success: false,
  loading: false,
  message: '',
  video_title: '',
  video_link:'',
}
app.post("/process",upload.single('music'), async (req, res) => {
  const file = req.file;
  console.log(file);
  if (!file) {
    return res.render("index", {...data, message: "No file uploaded" });
  }
  // const _file = path.join(__dirname,"tmp",file.filename)
  // file.mv(_file, (err) => {
  //   if (err)
  //     return res.render("index", {
  //       ...data, loading: false,
  //       message: `File Upload Error : ${err.message}`,
  //     });
  // });
  const fileName = file.filename.slice(0, -4);  
  // const fileName = file.filename + '.mp3';

  const filePath = path.join(__dirname,"tmp");
  const inputFilePath = path.join(filePath, file.filename);

  const outputFileName = new Date() + "-separated_sound";
  const outputDir = __dirname + "/output"
  const outputFilePath = path.join(outputDir, outputFileName);
  const outputVocalsPath = path.join(outputFilePath,fileName);
  const vocalsFile = path.join(outputVocalsPath, "vocals.mp3");

  // if(fs.existsSync(inputFilePath)){
  //   fs.unlink(inputFilePath, (err) => {
  //     if (err) console.error(err.message);
  //   })
  // }
  // if(fs.existsSync(outputDir)){
  //   deleteDirectory(outputDir);
  // }

  // res.render("index",{...data,loading: true,success: true, message: "vocals.mp3 file is generating, please wait..."})
  
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
  });

  pythonProcess.stderr.on("data", (data) => {
  });
  pythonProcess.on('error',(err)=>{
    console.error(err);
  })
  pythonProcess.on("close", (code) => {
    console.error(code);
    if(!fs.existsSync(vocalsFile)) return res.render("index",{...data, message: "The vocal.mp3 has not been generated"})
    res.download(path.resolve(vocalsFile), (err) => {
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
      }else{
        if(fs.existsSync(inputFilePath)){
          fs.unlink(inputFilePath, (err) => {
            if (err) console.error(err.message);
          })
        }
        if(fs.existsSync(outputDir)){
          deleteDirectory(outputDir);
        }
      }
    })
    
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
