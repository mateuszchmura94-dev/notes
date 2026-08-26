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
app.use(express.json());
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
    
    if (response.data && response.data.artists && response.data.artists[0]) {
      return response.data.artists[0].strArtistThumb || "/images/default.jpg";
    }
    return "/images/default.jpg";
};

async function fetchAlbumImg(bandName, albumName) {
  const response = await axios.get(API_album + bandName + "&a=" + albumName);

if (response.data && response.data.album && response.data.album[0]) {
      return response.data.album[0].strAlbumThumb || "/images/default.jpg";
    }
    return "/images/default.jpg";
};

async function allBands(sortBy = 'name_asc') {
  let orderBy = "name ASC";

  switch (sortBy) {
    case 'name_desc':
      orderBy = "name DESC";
      break;
    case 'score_desc':
      orderBy = "score DESC, name ASC";
      break;
    case 'score_asc':
      orderBy = "score ASC, name ASC";
      break;
    case 'name_asc':
    default:
      orderBy = "name ASC";
      break;
  }
  const result = await db.query(`SELECT * FROM bands ORDER BY ${orderBy}`);

  return result.rows
};

async function getBand(bandId) {
  const result = await db.query("SELECT * FROM bands WHERE id=$1", [bandId]);
  return result.rows[0]
};


async function getAlbum(albumId) {
  const result = await db.query("SELECT * FROM albums WHERE id=$1;", [albumId]);
  return result.rows[0]
};


async function getSong(songId) {
  const result = await db.query("SELECT * FROM songs WHERE id=$1;", [songId]);
  return result.rows[0]
};

//Strona główna
app.get("/", async (req, res) => {
  try {
    const sortOption = req.query.sort || 'name_asc';
    const bands = await allBands(sortOption);
    res.render("index.ejs", {
      title: "Moje ulubione zespoły",
      bandList: bands,
      currentSort: sortOption
    });
  } catch (err) {
    console.error("Błąd podczas pobierania listy zespołów:", err.stack);
    res.status(500).send("Wystąpił błąd serwera");
  };
});

//usuwanie zespołu
app.delete("/delete/band/:id", async (req, res) => {
  try {
    const toDelete = req.params.id;
    const albumsId = await db.query("SELECT id FROM albums WHERE band_id = $1", [toDelete]);
    const deleteSongs = await db.query("DELETE FROM songs WHERE album_id = ANY($1)", [albumsId.rows.map(row => row.id)]);
    const deleteAlbums = await db.query("DELETE FROM albums WHERE band_id = $1", [toDelete]);
    const result = await db.query("DELETE FROM bands WHERE id = $1", [toDelete]);
        res.json({ success: true, message: 'Usunięto pomyślnie' });
  } catch (err) {
    console.error("Błąd podczas usuwania zespołu:", err.stack);
    res.status(500).send("Wystąpił błąd serwera");
  };
});
//usuwanie albumu
app.delete("/delete/album/:id", async (req, res) => {
  try {
    const toDelete = req.params.id;
    const deleteSongs = await db.query("DELETE FROM songs WHERE album_id = $1", [toDelete]);
    const result = await db.query("DELETE FROM albums WHERE id = $1", [toDelete]);
    res.json({ success: true, message: 'Usunięto pomyślnie' });
  } catch (err) {
    console.error("Błąd podczas usuwania płyty:", err.stack);
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
    res.json({ success: true, message: 'Zespół dodany pomyślnie' });
  } catch (err) {
    console.error("Błąd podczas dodawania zespołu:", err.stack);
    res.status(500).send("Wystąpił błąd serwera");
  }
});
//dodawanie płyty
app.post("/add/album", async (req, res) => {
  const {
    albumName,
    albumScore,
    albumNote,
    bandId,
    bandName
  } = req.body;
  try {
    const link = await fetchAlbumImg(bandName, albumName);
    await db.query("INSERT INTO albums (name, score, note, img, band_id) VALUES ($1, $2, $3, $4, $5)", [albumName, albumScore, albumNote, link, bandId]);
    res.json({ success: true, message: 'Pomyślnie dodano płytę' });
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
    const sortOption = req.query.sort || 'score_desc';
    let orderBy = "a.score DESC, a.name ASC";
    switch (sortOption) {
      case 'score_asc':
        orderBy = "a.score ASC, a.name ASC";
        break;
      case 'name_asc':
        orderBy = "a.name ASC";
        break;
      case 'name_desc':
        orderBy = "a.name DESC";
        break;
      case 'score_desc':
      default:
        orderBy = "a.score DESC, a.name ASC";
        break;
    }
    const band = await getBand(req.params.bandId);
    if (!band) return res.status(404).send("Nie znaleziono zespołu");
    const data = await db.query(`SELECT b.id AS band_id, b.name AS band_name, b.note AS band_note, b.score AS band_score, b.img AS band_img, a.id AS album_id, a.name AS album_name, a.note AS album_note, a.score AS album_score, a.img AS album_img FROM bands b LEFT JOIN albums a ON b.id = a.band_id WHERE b.id = $1 ORDER BY ${orderBy}`, [req.params.bandId]);
    res.render("bandcard.ejs", {
    title: band.name,
     band: band,
     data: data.rows,
    currentSort: sortOption
    });
  } catch (err) {
    console.error("Błąd podczas wyświetlania zespołu:", err.stack);
    res.status(500).send("Wystąpił błąd serwera");
  };
});
//wyswietlanie plyty
app.get("/albums/:albumId", async (req, res) => {
  try {
    const sortOption = req.query.sort || 'score_desc';
    
    let orderBy = "s.score DESC, s.name ASC";
    switch (sortOption) {
      case 'score_asc':
        orderBy = "s.score ASC, s.name ASC";
        break;
      case 'name_asc':
        orderBy = "s.name ASC";
        break;
      case 'name_desc':
        orderBy = "s.name DESC";
        break;
      case 'score_desc':
      default:
        orderBy = "s.score DESC, s.name ASC";
        break;
    }

    const data = await db.query(`SELECT a.id AS album_id, a.name AS album_name, a.note AS album_note, a.score AS album_score, a.img AS album_img, s.id AS song_id, s.name AS song_name, s.score AS song_score FROM albums a LEFT JOIN songs s ON a.id = s.album_id WHERE a.id = $1 ORDER BY ${orderBy}`, [req.params.albumId]);
    res.render("albumcard.ejs", {
      title: data.rows[0].album_name,
      data: data.rows,
      currentSort: sortOption
    });
  } catch (err) {
    console.error("Błąd podczas wyświetlania płyty:", err.stack);
    res.status(500).send("Wystąpił błąd serwera");
  };
});
//dodawanie utworu
app.post("/add/song", async (req, res) => {
  const {
    songName,
    songScore,
    albumId
  } = req.body;
  try {
    await db.query("INSERT INTO songs (name, score, album_id) VALUES ($1, $2, $3)", [songName, songScore, albumId]);
    res.json({ success: true, message: 'Pomyślnie dodano utwór' });
  } catch (err) {
    console.error("Błąd podczas dodawania utworu:", err.stack);
    res.status(500).send("Wystąpił błąd serwera");
  }
});
//usuwanie utworu
app.delete("/delete/song/:id", async (req, res) => {
  try {
    const toDelete = req.params.id;
    const result = await db.query("DELETE FROM songs WHERE id = $1", [toDelete]);
    res.json({ success: true, message: 'Usunięto pomyślnie' });
  } catch (err) {
    console.error("Błąd podczas usuwania utworu:", err.stack);
    res.status(500).send("Wystąpił błąd serwera");
  };
});
app.put("/update/:type/:id", async (req, res) => {
  const { type, id } = req.params;
  const { name, score, note } = req.body;

  try {
    if (type === 'band') {
      await db.query("UPDATE bands SET name = $1, score = $2, note = $3 WHERE id = $4", [name, score, note, id]);
    } else if (type === 'album') {
      await db.query("UPDATE albums SET name = $1, score = $2, note = $3 WHERE id = $4", [name, score, note, id]);
    } else if (type === 'song') {
      await db.query("UPDATE songs SET name = $1, score = $2 WHERE id = $3", [name, score, id]);
    }

    res.json({ success: true, message: 'Zaktualizowano pomyślnie' });
  } catch (err) {
    console.error("Błąd podczas aktualizacji:", err.stack);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

//Listening
app.listen(port, () => {
  console.log("Serwer nasłuchuje na porcie", port);
});