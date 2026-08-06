DATABASE NAME fav_bands


CREATE TABLE band (
id SERIAL PRIMARY KEY,
name VARCHAR(50) UNIQUE NOT NULL,
add_date DATE,
note VARCHAR,
score int
);

CREATE TABLE album (
id SERIAL PRIMARY KEY,
name VARCHAR(100) NOT NULL,
add_date DATE,
score INT,
band_id int NOT NULL REFERENCES band(id)
);

CREATE TABLE songs (
id SERIAL PRIMARY KEY,
name VARCHAR(100) NOT NULL,
score INT,
album_id int NOT NULL REFERENCES album(id)
);