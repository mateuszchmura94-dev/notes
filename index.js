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
app.use(bodyParser.urlencoded({
  extended: true
}));
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
  return link;
};

async function allBands() {
  const result = await db.query("SELECT * FROM bands");

  return result.rows
};

async function getBand(bandId) {
  const result = await db.query("SELECT * FROM bands WHERE id=$1", [bandId]);
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

async function getSong(songId) {
  const result = await db.query("SELECT * FROM songs WHERE id=$1;", [songId]);
  return result.rows[0]
};

//Strona główna
app.get("/", async (req, res) => {
  try {
    const bands = await allBands();
    res.render("index.ejs", {
      title: "Moje ulubione zespoły",
      bandList: bands
    });
  } catch (err) {
    console.error("Błąd podczas pobierania listy zespołów:", err.stack);
    res.status(500).send("Wystąpił błąd serwera");
  };
});

//usuwanie zespołu
app.post("/delete/:id", async (req, res) => {
  try {
    const toDelete = req.params.id;
    const albumsId = await db.query("SELECT id FROM albums WHERE band_id = $1", [toDelete]);
    const deleteSongs = await db.query("DELETE FROM songs WHERE album_id = ANY($1)", [albumsId.rows.map(row => row.id)]);
    const deleteAlbums = await db.query("DELETE FROM albums WHERE band_id = $1", [toDelete]);
    const result = await db.query("DELETE FROM bands WHERE id = $1", [toDelete]);
    res.redirect("/");
  } catch (err) {
    console.error("Błąd podczas usuwania zespołu:", err.stack);
    res.status(500).send("Wystąpił błąd serwera");
  };
});
//usuwanie albumu
app.post("/delete/album/:id", async (req, res) => {
  try {
    const toDelete = req.params.id;
    const deleteSongs = await db.query("DELETE FROM songs WHERE album_id = $1", [toDelete]);
    const result = await db.query("DELETE FROM albums WHERE id = $1", [toDelete]);
    const data = await db.query("SELECT b.id AS band_id, b.name AS band_name, b.note AS band_note, b.score AS band_score, b.img AS band_img, a.id AS album_id, a.name AS album_name, a.note AS album_note, a.score AS album_score, a.img AS album_img FROM bands b LEFT JOIN albums a ON b.id = a.band_id WHERE b.id = $1", [req.params.bandId]);

    res.render("bandcard.ejs", {
      title: data.rows[0].band_name,
      data: data.rows
    });
  } catch (err) {
    console.error("Błąd podczas usuwania płyty:", err.stack);
    res.status(500).send("Wystąpił błąd serwera");
  };
});
//edytowanie zespołu
app.post("/edit/:bandId", async (req, res) => {
  try {
    const toEdit = await getBand(req.params.bandId);
    res.render("edit.ejs", {
      edited: toEdit,
      title: toEdit.name
    });
  } catch (err) {
    console.error("Błąd podczas pobierania zespołu do edycji:", err.stack);
    res.status(500).send("Wystąpił błąd serwera");
  };
});
//edytowanie albumu
app.post("/edit/album/:albumId", async (req, res) => {
  try {
    const toEdit = await getAlbum(req.params.albumId);
    res.render("edit.ejs", {
      edited: toEdit,
      title: toEdit.name,
    });
  } catch (err) {
    console.error("Błąd podczas pobierania płyty do edycji:", err.stack);
    res.status(500).send("Wystąpił błąd serwera");
  };
});
//edytowanie utworu
app.post("/edit/song/:songId", async (req, res) => {
  try {
    const toEdit = await getSong(req.params.songId);
    res.render("edit.ejs", {
      edited: toEdit,
      title: toEdit.name,
    });
  } catch (err) {
    console.error("Błąd podczas pobierania utworu do edycji:", err.stack);
    res.status(500).send("Wystąpił błąd serwera");
  };
});
///dodawanie zespołu
app.post("/add/band", async (req, res) => {
  const {
    bandName,
    bandScore,
    bandNote
  } = req.body;
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
app.post("/add/album/:bandId", async (req, res) => {
  const {
    albumName,
    albumScore,
    albumNote,
    bandName
  } = req.body;
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
  const {
    name,
    score,
    note
  } = req.body;
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
  const {
    name,
    score,
    note
  } = req.body;
  try {
    await db.query("UPDATE albums SET name = $1, score = $2, note = $3 WHERE id = $4", [name, score, note, req.params.albumId]);
    res.redirect("/albums/" + req.params.albumId);
  } catch (err) {
    console.error("Błąd podczas edytowania płyty:", err.stack);
    res.status(500).send("Wystąpił błąd serwera");
  }
});
//zatwierdzenie zmian - utwór
app.post("/update/song/:songId", async (req, res) => {
  const {
    name,
    score,
    note
  } = req.body;
  try {
    await db.query("UPDATE songs SET name = $1, score = $2 WHERE id = $3", [name, score, req.params.songId]);
    const result = await db.query("SELECT album_id FROM songs WHERE id = $1", [req.params.songId]);
    res.redirect("/albums/" + result.rows[0].album_id);
  } catch (err) {
    console.error("Błąd podczas edytowania utworu:", err.stack);
    res.status(500).send("Wystąpił błąd serwera");
  }
});
//wyswietlanie zespolu
app.get("/:bandId", async (req, res) => {
  try {
    const data = await db.query("SELECT b.id AS band_id, b.name AS band_name, b.note AS band_note, b.score AS band_score, b.img AS band_img, a.id AS album_id, a.name AS album_name, a.note AS album_note, a.score AS album_score, a.img AS album_img FROM bands b LEFT JOIN albums a ON b.id = a.band_id WHERE b.id = $1", [req.params.bandId]);
    res.render("bandcard.ejs", {
      title: data.rows[0].band_name,
      data: data.rows
    });
  } catch (err) {
    console.error("Błąd podczas wyświetlania zespołu:", err.stack);
    res.status(500).send("Wystąpił błąd serwera");
  };
});
//wyswietlanie plyty
app.get("/albums/:albumId", async (req, res) => {
  try {
    const data = await db.query("SELECT a.id AS album_id, a.name AS album_name, a.note AS album_note, a.score AS album_score, a.img AS album_img, s.id AS song_id, s.name AS song_name, s.score AS song_score FROM albums a LEFT JOIN songs s ON a.id = s.album_id WHERE a.id = $1", [req.params.albumId]);
    res.render("albumcard.ejs", {
      title: data.rows[0].album_name,
      data: data.rows
    });
  } catch (err) {
    console.error("Błąd podczas wyświetlania płyty:", err.stack);
    res.status(500).send("Wystąpił błąd serwera");
  };
});
app.post("/add/song/:albumId", async (req, res) => {
  const {
    songName,
    songScore
  } = req.body;
  try {
    await db.query("INSERT INTO songs (name, score, album_id) VALUES ($1, $2, $3)", [songName, songScore, req.params.albumId]);
    const data = await db.query("SELECT a.id AS album_id, a.name AS album_name, a.note AS album_note, a.score AS album_score, a.img AS album_img, s.id AS song_id, s.name AS song_name, s.score AS song_score FROM albums a LEFT JOIN songs s ON a.id = s.album_id WHERE a.id = $1", [req.params.albumId]);
    res.render("albumcard.ejs", {
      title: data.rows[0].album_name,
      data: data.rows
    });
  } catch (err) {
    console.error("Błąd podczas dodawania utworu:", err.stack);
    res.status(500).send("Wystąpił błąd serwera");
  }
});
//usuwanie utworu
app.post("/delete/song/:id", async (req, res) => {
  try {
    const toDelete = req.params.id;
    const result = await db.query("DELETE FROM songs WHERE id = $1", [toDelete]);;
    const data = await db.query("SELECT a.id AS album_id, a.name AS album_name, a.note AS album_note, a.score AS album_score, a.img AS album_img, s.id AS song_id, s.name AS song_name, s.score AS song_score FROM albums a LEFT JOIN songs s ON a.id = s.album_id WHERE a.id = $1", [req.params.albumId]);
    res.render("albumcard.ejs", {
      title: data.rows[0].album_name,
      data: data.rows
    });
  } catch (err) {
    console.error("Błąd podczas usuwania utworu:", err.stack);
    res.status(500).send("Wystąpił błąd serwera");
  };
});

//Listening
app.listen(port, () => {
  console.log("Serwer nasłuchuje na porcie", port);
});