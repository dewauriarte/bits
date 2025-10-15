-- AlterTable
-- Cambiar columnas de medios de VARCHAR(255) a TEXT para soportar imágenes base64
ALTER TABLE "public"."preguntas" 
  ALTER COLUMN "imagen_url" TYPE TEXT,
  ALTER COLUMN "video_url" TYPE TEXT,
  ALTER COLUMN "audio_url" TYPE TEXT,
  ALTER COLUMN "imagen_explicacion" TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."quizzes" 
  ALTER COLUMN "imagen_portada" TYPE TEXT;
