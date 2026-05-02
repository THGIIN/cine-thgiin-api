-- Índice em `genre` para acelerar filtros `genre=` na listagem.
CREATE INDEX "Movie_genre_idx" ON "Movie"("genre");
