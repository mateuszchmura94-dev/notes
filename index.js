import express from "express";
import ejs from "ejs";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const API_band = "https://www.theaudiodb.com/api/v1/json/123/search.php?s=";
const API_album = "https://www.theaudiodb.com/api/v1/json/123/searchalbum.php?s="

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
async function fetchBandImg(bandName) {
    const response = await axios.get(API_band + bandName);
    const link = response.data.artists[0].strArtistThumb;
    return link;
};

async function fetchAlbumImg(bandName, albumName) {
    const response = await axios.get(API_album + bandName + "&a=" + albumName);
    const link = response.data.album[0].strAlbumThumb;
    console.log(link);
    return link;
};

async function allBands () {
        const result = await db.query("SELECT * FROM bands");
        
    return result.rows
};

async function getBand(bandId) {
    const result = await db.query("SELECT * FROM bands WHERE id=$1",  [bandId]);
    return result.rows[0]
};

async function allAlbums(bandId) {
        const result = await db.query("SELECT * FROM albums WHERE band_id = $1", [bandId]);
        
    return result.rows
};

async function getAlbum(albumId) {
        const result = await db.query("SELECT * FROM albums WHERE id=$1;", [albumId]);
        return result.rows[0]
};

async function allSongs(albumId) {
        const result = await db.query("SELECT * FROM songs WHERE album_id=$1;", [albumId]);
        return result.rows
};

//Strona główna
app.get("/", async (req, res) => {
    try {
        const bands = await allBands();
        res.render("index.ejs", { title: "Moje ulubione zespoły", bandList: bands });
    } catch (err) {
        console.error("Błąd podczas pobierania listy zespołów:", err.stack);
        res.status(500).send("Wystąpił błąd serwera");
    };
});

//usuwanie zespołu
app.post("/delete/:id", async (req, res) => {
        try{
        const toDelete = req.params.id;
        const result = await db.query("DELETE FROM bands WHERE id = $1", [toDelete]);
        res.redirect("/");
        } catch (err) {
            console.error("Błąd podczas usuwania zespołu:", err.stack);
            res.status(500).send("Wystąpił błąd serwera");
        }; 
});
//usuwanie albumu
app.post("/delete/album/:id", async (req, res) => {
        try{
        const toDelete = req.params.id;
        const result = await db.query("DELETE FROM albums WHERE id = $1", [toDelete]);
        console.log(req.params);
        res.redirect("/");
        } catch (err) {
            console.error("Błąd podczas usuwania płyty:", err.stack);
            res.status(500).send("Wystąpił błąd serwera");
        };
});
//edytowanie zespołu
app.post("/edit/:bandId", async (req, res) => {
        try {
        const toEdit = await getBand(req.params.bandId);
        } catch (err) {
            console.error("Błąd podczas pobierania zespołu do edycji:", err.stack);
            res.status(500).send("Wystąpił błąd serwera");
        };

        res.render("edit.ejs", { 
            edited: toEdit, 
            title: toEdit.name
        });
    
});
//edytowanie albumu
app.post("/edit/album/:albumId", async (req, res) => {
        try {
        const album = await getAlbum(req.params.albumId);
        } catch (err) {
            console.error("Błąd podczas pobierania płyty do edycji:", err.stack);
            res.status(500).send("Wystąpił błąd serwera");
        };
        res.render("edit.ejs", { 
            edited: album, 
            title: album.name,
        });
    
});
///dodawanie zespołu
app.post("/addband", async (req, res) => {
    const { bandName, bandScore, bandNote } = req.body;
    try {
        const link = await fetchBandImg(bandName);
        await db.query("INSERT INTO bands (name, score, note, img) VALUES ($1, $2, $3, $4)", [bandName, bandScore, bandNote, link]);
        res.redirect("/");
    } catch (err) {
        console.error("Błąd podczas dodawania zespołu:", err.stack);
        res.status(500).send("Wystąpił błąd serwera");
    }
});
//dodawanie płyty
app.post("/addalbum/:bandId", async (req, res) => {
    const { albumName, albumScore, albumNote, bandName} = req.body;
    try {
        const link = await fetchAlbumImg(bandName, albumName);
        await db.query("INSERT INTO albums (name, score, note, img, band_id) VALUES ($1, $2, $3, $4, $5)", [albumName, albumScore, albumNote, link, req.params.bandId]);
        res.redirect("/" + req.params.bandId);
    } catch (err) {
        console.error("Błąd podczas dodawania płyty:", err.stack);
        res.status(500).send("Wystąpił błąd serwera");
    }
});
//zatwierdzenie zmian - zespół
app.post("/update/:id", async (req, res) => {
    const { name, score, note } = req.body;
    try {
        await db.query("UPDATE bands SET name = $1, score = $2, note = $3 WHERE id = $4", [name, score, note, req.params.id]);
        res.redirect("/");
    } catch (err) {
        console.error("Błąd podczas edytowania zespołu:", err.stack);
        res.status(500).send("Wystąpił błąd serwera");
    }
});
//zatwierdzenie zmian - płyta
app.post("/update/album/:albumId", async (req, res) => {
    const { name, score, note } = req.body;
    console.log(req.body);
    try {
        await db.query("UPDATE albums SET name = $1, score = $2, note = $3 WHERE id = $4", [name, score, note, req.params.albumId]);
        res.redirect("/");
    } catch (err) {
        console.error("Błąd podczas edytowania płyty:", err.stack);
        res.status(500).send("Wystąpił błąd serwera");
    }
});
//wyswietlanie zespolu
app.get("/:bandId", async (req, res) => {
    const band = await getBand(req.params.bandId);
    console.log(band);
    console.log(req.params.bandId);
    const albums = await allAlbums(req.params.bandId);
    res.render("bandcard.ejs", { title: band.name, 
        band: band,
        albumsList: albums
    });
});
//wyswietlanie plyty
app.get("/albums/:albumId", async (req, res) => {
    const album = await getAlbum(req.params.albumId);
    const songs = await allSongs(req.params.albumId);
    console.log(album);
    res.render("albumcard.ejs", { title: album.name, 
        album: album,
        songs: songs
    });
});
app.post("/addsong/:albumId", async (req, res) => {
    const { songName, songScore} = req.body;
    const { albumId, albumName, albumNote, bandId, albumImg} = req.body;
    const album = { 
    id: albumId, 
    name: albumName, 
    note: albumNote, 
    band_id: bandId, 
    img: albumImg
    };
    try {
        await db.query("INSERT INTO songs (name, score, album_id) VALUES ($1, $2, $3)", [songName, songScore, req.params.albumId]);
        const songs = await allSongs(albumId);
        res.render("albumcard.ejs", {
        title: album.name, 
        album: album,
        songs: songs
        });
    } catch (err) {
        console.error("Błąd podczas dodawania utworu:", err.stack);
        res.status(500).send("Wystąpił błąd serwera");
    }
});
//usuwanie utworu
app.post("/delete/song/:id", async (req, res) => {
        try{
        const toDelete = req.params.id;
        const result = await db.query("DELETE FROM songs WHERE id = $1", [toDelete]);;
        res.redirect("/");
        } catch (err) {
            console.error("Błąd podczas usuwania utworu:", err.stack);
            res.status(500).send("Wystąpił błąd serwera");
        };
});

//Listening
app.listen(port, () => {
    console.log("Serwer nasłuchuje na porcie", port);
});
