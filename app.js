const express = require('express');
const fetch = require('node-fetch');
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.static("public"))

app.use(express.urlencoded({extended: true}));  
app.use(express.json());

app.get("/", (req, res) =>{
    res.render("index");
})
app.post("/convert-mp3", async (req, res) =>{
    const videoUrl = req.body.videoUrl
    
    let regex = /v=([^&]+)/;
    let match = videoUrl.match(regex);
    let videoId
    match ? videoId = match[1] : ""
    if(!match){
        match = videoUrl.lastIndexOf('.be/')
         videoId = match > -1 ? videoUrl.substring(match + 4): ""
        
    }
    if(!videoId || videoId.length === 0) return res.render("index",{success: false, message: 'Video url is not correct'})
        else{ 
            const fetchApi = await fetch(`${process.env.API_URL}?id=${videoId}`,{
            "method": 'GET',
            "headers": {
                "x-rapidapi-key": process.env.API_KEY,
                "x-rapidapi-host": process.env.API_HOST
            }
        })
        const response = await fetchApi.json()
        if(response.status === "ok") return res.render("index", {success: true, video_title: response.title, video_link: response.link})
        else return res.render("index", {success: false, message: response.message})
        }
    //  {
    //     )
    // }else{
        
    // }
})  

app.listen(PORT, ()=> console.log('Server listening on port ' + PORT));