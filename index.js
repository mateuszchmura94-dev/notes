import express from "express";
import ejs from "ejs";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

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

//Strona główna
app.get("/", async (req, res) => {
    res.render("index.ejs");
});

//Listening
app.listen(port, () => {
    console.log("Serwer nasłuchuje na porcie", port);
});
