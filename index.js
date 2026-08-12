import express from "express";
import ejs from "ejs";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const API = "https://www.theaudiodb.com/api/v1/json/123/search.php?s=";

//Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//DB connection
const db = new pg.Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

db.connect()
    .then(() => console.log("Połączenie z bazą danych zostało poprawnie nawiązane"))
    .catch((err) => console.error("Błąd połączenia z bazą danych:", err.stack));

//===========================================================================================================================
//ROUTES
//===========================================================================================================================
async function fetchImg(bandName) {
    const response = await axios.get(API + bandName);
    const link = response.data.artists[0].strArtistThumb;
    return link;
}
//Strona główna
app.get("/", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM bands");
        const bands = result.rows;
        await Promise.all(bands.map(async (band) => {
            const pic = await fetchImg(band.name);
            band.img = pic;
        }))
       
       
      //  bands.forEach(async (band) => {
      ////      const pic = await fetchImg(band.name);
      //      band.img = pic;
      //      console.log(pic);
      //  });
       
        //obr.artists[0].strArtistThumb
        console.log(bands);
        res.render("index.ejs", { bandList: bands });
    } catch (err) {
        console.error("Błąd podczas pobierania listy zespołów:", err.stack);
        res.status(500).send("Wystąpił błąd serwera");
    }
    

});
app.post("/delete:id", async (req, res) => {
        console.log(req.params.id);
        res.redirect("/");
    
});
app.post("/edit:id", async (req, res) => {
        console.log(req.params.id);
        res.redirect("/");
    
});

app.post("/add", async (req, res) => {
    const { bandName, bandScore, bandNote } = req.body;
    try {
        await db.query("INSERT INTO bands (name, score, note) VALUES ($1, $2, $3)", [bandName, bandScore, bandNote]);
        res.redirect("/");
    } catch (err) {
        console.error("Błąd podczas dodawania zespołu:", err.stack);
        res.status(500).send("Wystąpił błąd serwera");
    }
});

//Listening
app.listen(port, () => {
    console.log("Serwer nasłuchuje na porcie", port);
});
