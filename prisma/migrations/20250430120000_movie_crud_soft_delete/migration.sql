-- Soft delete, gênero (string) e campos obrigatórios de domínio; remove colunas legadas não usadas no CRUD básico.

ALTER TABLE "Movie" ADD COLUMN "genre" TEXT;
ALTER TABLE "Movie" ADD COLUMN "deletedAt" TIMESTAMP(3);

UPDATE "Movie" SET "releaseYear" = 2000 WHERE "releaseYear" IS NULL;
UPDATE "Movie" SET "rating" = 0 WHERE "rating" IS NULL;

ALTER TABLE "Movie" ALTER COLUMN "releaseYear" SET NOT NULL;
ALTER TABLE "Movie" ALTER COLUMN "rating" SET NOT NULL;

ALTER TABLE "Movie" DROP COLUMN "originalTitle";
ALTER TABLE "Movie" DROP COLUMN "durationMinutes";
ALTER TABLE "Movie" DROP COLUMN "posterUrl";

CREATE INDEX "Movie_rating_idx" ON "Movie"("rating");
CREATE INDEX "Movie_deletedAt_idx" ON "Movie"("deletedAt");
