-- Fix: Actualizar constraint para permitir TODOS los tipos de preguntas
-- Error: "preguntas_tipo_check" no permite 'fill_blanks', 'short_answer', etc.

-- 1. Eliminar constraint viejo
ALTER TABLE preguntas DROP CONSTRAINT IF EXISTS preguntas_tipo_check;

-- 2. Crear nuevo constraint con TODOS los tipos
ALTER TABLE preguntas 
ADD CONSTRAINT preguntas_tipo_check 
CHECK (tipo IN (
  'multiple_choice',
  'multiple_select', 
  'true_false',
  'short_answer',
  'fill_blanks',
  'order_sequence',
  'match_pairs'
));

-- 3. Verificar que funciona
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conname = 'preguntas_tipo_check';
