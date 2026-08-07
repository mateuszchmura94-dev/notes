DATABASE NAME fav_bands


CREATE TABLE bands (
id SERIAL PRIMARY KEY,
name VARCHAR(100) UNIQUE NOT NULL,
add_date DATE DEFAULT CURRENT_DATE,
note TEXT,
score INT CHECK (score >= 0 AND score <= 5)
);

CREATE TABLE albums (
id SERIAL PRIMARY KEY,
name VARCHAR(100) NOT NULL,
add_date DATE DEFAULT CURRENT_DATE,
note TEXT,
score INT CHECK (score >= 0 AND score <= 5),
band_id int NOT NULL REFERENCES bands(id)
);

CREATE TABLE songs (
id SERIAL PRIMARY KEY,
name VARCHAR(100) NOT NULL,
score INT,
album_id int NOT NULL REFERENCES albums(id)
);