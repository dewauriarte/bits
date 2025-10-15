import prisma from '../config/database';
import { AIConfigService } from './aiConfig.service';
import { AIGenerateQuizInput } from '../schemas/quiz.schema';
// pdf-parse doesn't have proper ES module support, use require
const pdfParse = require('pdf-parse');

interface GeneratedQuestion {
  texto: string;
  tipo: 'multiple_choice' | 'multiple_select' | 'true_false' | 'short_answer' | 'fill_blanks' | 'order_sequence' | 'match_pairs';
  opciones: { texto: string; imagen_url?: string }[];
  respuesta_correcta: string | string[];
  puntos: number;
  tiempo_limite: number;
  explicacion?: string;
}

interface GeneratedQuizResponse {
  titulo: string;
  descripcion: string;
  preguntas: GeneratedQuestion[];
}

export class AIService {
  private aiConfigService = new AIConfigService();

  /**
   * Generar quiz completo con IA
   */
  async generateQuiz(userId: string, params: AIGenerateQuizInput): Promise<string> {
    const startTime = Date.now();
    let logId: string | null = null;

    try {
      // Obtener configuración de IA del usuario
      const config = await this.aiConfigService.getUserAIConfigInternal(userId);
      if (!config || !config.api_key || !config.is_active) {
        throw new Error('No tienes configuración de IA activa. Por favor configura tu API key primero.');
      }

      // Obtener info de materia y grado para contexto
      const [materia, grado] = await Promise.all([
        prisma.materias.findUnique({ where: { id: params.materia_id } }),
        prisma.grados.findUnique({ where: { id: params.grado_id } }),
      ]);

      if (!materia || !grado) {
        throw new Error('Materia o grado no encontrado');
      }

      // Construir prompt optimizado
      const prompt = this.buildPrompt(params, materia.nombre, grado.nombre);

      // Crear log ANTES de llamar a la IA
      const logEntry = await prisma.logs_ia.create({
        data: {
          usuario_id: userId,
          tipo_operacion: 'generate_quiz',
          prompt,
          proveedor: config.provider,
          modelo: config.model,
          exitoso: false, // Se actualizará después
        },
      });
      logId = logEntry.id;

      // Llamar a la IA con retry logic
      const generatedData = await this.callAIWithRetry(config, prompt, 3);

      // Calcular métricas
      const processingTime = Date.now() - startTime;
      const tokensUsed = this.estimateTokens(prompt, JSON.stringify(generatedData));
      const estimatedCost = this.estimateCost(config.provider, tokensUsed);

      // Actualizar log con éxito
      await prisma.logs_ia.update({
        where: { id: logId },
        data: {
          respuesta: generatedData as any,
          tokens_usados: tokensUsed,
          costo_estimado: estimatedCost,
          tiempo_procesamiento_ms: processingTime,
          exitoso: true,
        },
      });

      // Validar estructura de respuesta
      this.validateGeneratedQuiz(generatedData);

      // Crear quiz en la BD
      const quizId = await this.createQuizFromGenerated(
        userId,
        generatedData,
        params,
        config.provider
      );

      return quizId;
    } catch (error: any) {
      const processingTime = Date.now() - startTime;

      // Actualizar log con error
      if (logId) {
        await prisma.logs_ia.update({
          where: { id: logId },
          data: {
            exitoso: false,
            error: error.message,
            tiempo_procesamiento_ms: processingTime,
          },
        });
      }

      throw error;
    }
  }

  /**
   * Generar quiz desde PDF
   */
  async generateFromPDF(
    userId: string,
    pdfBuffer: Buffer,
    params: Omit<AIGenerateQuizInput, 'prompt'>
  ): Promise<string> {
    const startTime = Date.now();
    let logId: string | null = null;

    try {
      // Obtener configuración de IA del usuario
      const config = await this.aiConfigService.getUserAIConfigInternal(userId);
      if (!config || !config.api_key || !config.is_active) {
        throw new Error('No tienes configuración de IA activa. Por favor configura tu API key primero.');
      }

      // Extraer texto del PDF
      const pdfText = await this.extractPDFText(pdfBuffer);
      
      if (!pdfText || pdfText.trim().length < 100) {
        throw new Error('El PDF no contiene suficiente texto para generar un quiz');
      }

      // Obtener info de materia y grado
      const [materia, grado] = await Promise.all([
        prisma.materias.findUnique({ where: { id: params.materia_id } }),
        prisma.grados.findUnique({ where: { id: params.grado_id } }),
      ]);

      if (!materia || !grado) {
        throw new Error('Materia o grado no encontrado');
      }

      // Construir prompt con contenido del PDF
      const prompt = this.buildPromptFromPDF(pdfText, params, materia.nombre, grado.nombre);

      // Crear log
      const logEntry = await prisma.logs_ia.create({
        data: {
          usuario_id: userId,
          tipo_operacion: 'generate_quiz_from_pdf',
          prompt: `[PDF Content] ${pdfText.substring(0, 500)}...`,
          proveedor: config.provider,
          modelo: config.model,
          exitoso: false,
        },
      });
      logId = logEntry.id;

      // Llamar a la IA
      const generatedData = await this.callAIWithRetry(config, prompt, 3);

      // Calcular métricas
      const processingTime = Date.now() - startTime;
      const tokensUsed = this.estimateTokens(prompt, JSON.stringify(generatedData));
      const estimatedCost = this.estimateCost(config.provider, tokensUsed);

      // Actualizar log
      await prisma.logs_ia.update({
        where: { id: logId },
        data: {
          respuesta: generatedData as any,
          tokens_usados: tokensUsed,
          costo_estimado: estimatedCost,
          tiempo_procesamiento_ms: processingTime,
          exitoso: true,
        },
      });

      // Validar y crear quiz
      this.validateGeneratedQuiz(generatedData);
      const quizId = await this.createQuizFromGenerated(
        userId,
        generatedData,
        { ...params, prompt: 'Generado desde PDF' },
        config.provider
      );

      return quizId;
    } catch (error: any) {
      const processingTime = Date.now() - startTime;

      if (logId) {
        await prisma.logs_ia.update({
          where: { id: logId },
          data: {
            exitoso: false,
            error: error.message,
            tiempo_procesamiento_ms: processingTime,
          },
        });
      }

      throw error;
    }
  }

  /**
   * Extraer texto de PDF usando pdf-parse
   */
  async extractPDFText(buffer: Buffer): Promise<string> {
    const data = await pdfParse(buffer);
    
    // Limpiar texto
    let text = data.text
      .replace(/\s+/g, ' ') // Normalizar espacios
      .replace(/\n{3,}/g, '\n\n') // Reducir saltos de línea excesivos
      .trim();

    // Limitar tamaño si es muy grande (para no exceder límites de tokens)
    const maxChars = 15000; // ~3750 tokens aproximadamente
    if (text.length > maxChars) {
      text = text.substring(0, maxChars) + '...';
    }

    return text;
  }

  /**
   * Construir prompt optimizado para generación con múltiples tipos de preguntas
   */
  private buildPrompt(
    params: AIGenerateQuizInput,
    materiaName: string,
    gradoName: string
  ): string {
    const difficultyMap = {
      facil: 'fácil (apropiado para estudiantes que están aprendiendo el tema)',
      medio: 'medio (requiere comprensión del tema)',
      dificil: 'difícil (requiere análisis profundo y pensamiento crítico)',
    };

    // Determinar qué tipos de preguntas usar
    const allowedTypes = params.question_types && params.question_types.length > 0
      ? params.question_types
      : ['multiple_choice', 'multiple_select', 'true_false', 'short_answer', 'fill_blanks', 'order_sequence', 'match_pairs'];

    const typeRestriction = params.question_types && params.question_types.length > 0
      ? `\n**IMPORTANTE: El usuario ha solicitado SOLO estos tipos de preguntas: ${allowedTypes.join(', ')}**\nDEBES usar ÚNICAMENTE estos tipos. No uses otros tipos de preguntas.`
      : '\n**IMPORTANTE: Usa una VARIEDAD de tipos de preguntas. No uses solo multiple_choice.**';

    // Obtener guías específicas por grado
    const gradeGuide = this.getGradeSpecificGuide(gradoName, materiaName);

    return `Eres un experto en educación creando un quiz educativo INTERACTIVO Y VARIADO. Genera un quiz con las siguientes especificaciones:

**Contexto:**
- Materia: ${materiaName}
- Grado: ${gradoName}
- Dificultad: ${difficultyMap[params.dificultad]}
- Número de preguntas: ${params.num_questions}
- Tema: ${params.prompt}
${typeRestriction}

${gradeGuide}

**TIPOS DE PREGUNTAS DISPONIBLES:**

🚨 **FORMATO CRÍTICO DE OPCIONES - LEE ESTO PRIMERO:**
CADA opción DEBE ser un objeto JSON con la propiedad "texto".

FORMATO CORRECTO:
"opciones": [
  { "texto": "Respuesta A" },
  { "texto": "Respuesta B" }
]

FORMATO INCORRECTO (NO USAR):
"opciones": ["Respuesta A", "Respuesta B"]

Si usas strings simples en lugar de objetos, el quiz será RECHAZADO.

1. **multiple_choice** - Opción múltiple (UNA respuesta correcta)
   - SIEMPRE 4 opciones (no menos) - incluye distractores convincentes
   - Cada opción es un objeto: { "texto": "..." }
   - respuesta_correcta: ["0"] (índice de la opción correcta)
   - Las distractoras deben ser plausibles, no obviamente incorrectas

2. **multiple_select** - Selección múltiple (VARIAS respuestas correctas)
   - SIEMPRE 4 opciones mínimo (máximo 6) - incluye distractores convincentes
   - Cada opción es un objeto: { "texto": "..." }
   - respuesta_correcta: ["0", "2", "3"] (índices de opciones correctas)
   - Las distractoras deben ser plausibles

3. **true_false** - Verdadero/Falso
   - Exactamente 2 opciones en formato de objeto
   - Cada opción es un objeto: { "texto": "Verdadero" } y { "texto": "Falso" }
   - respuesta_correcta: "0" (string, no array) - "0" para Verdadero, "1" para Falso

4. **short_answer** - Respuesta corta
   - **IMPORTANTE: opciones DEBE ser array VACÍO: []**
   - respuesta_correcta: "respuesta esperada" (string, una o dos palabras)
   - Ejemplo: {"texto": "Capital de Francia?", "tipo": "short_answer", "opciones": [], "respuesta_correcta": "París"}

5. **fill_blanks** - Completar espacios
   - Texto con _____ como espacios (cuenta cuántos hay)
   - opciones: MÍNIMO 4-5 palabras disponibles - INCLUYE SIEMPRE DISTRACTORES plausibles
   - respuesta_correcta: ["palabra1", "palabra2"] (tantas como espacios haya, en orden)
   - Ejemplo: Si pregunta sobre capitales, incluye otras capitales como distractores

6. **order_sequence** - Ordenar secuencia
   - **IMPORTANTE:** Las opciones DEBEN estar DESORDENADAS (mezcladas al azar)
   - 3-5 elementos que el usuario debe ordenar
   - respuesta_correcta: índices en el orden correcto
   - Ejemplo: Si el orden correcto es [A, B, C], las opciones pueden ser [B, C, A] y respuesta_correcta: ["2", "0", "1"]
   - **NO presentes las opciones ya en orden correcto**

7. **match_pairs** - Relacionar columnas
   - Pares de conceptos (columna A y columna B)
   - opciones: [{"texto": "ItemA1 -> ItemB1"}, {"texto": "ItemA2 -> ItemB2"}]
   - respuesta_correcta: ["0", "1", "2"] (orden de emparejamiento correcto)

**INSTRUCCIONES IMPORTANTES:**

1. **VARIEDAD**: Usa DIFERENTES tipos de preguntas en el quiz. No uses solo multiple_choice.
   - Para grados menores (1-3): Más true_false, fill_blanks, y multiple_choice simples
   - Para grados medios (4-6): Combina todos los tipos, énfasis en multiple_select y order_sequence
   - Para grados mayores (7+): Todos los tipos, incluye más short_answer y match_pairs

2. **DIFICULTAD**: Ajusta la complejidad según el nivel:
   - Fácil: Preguntas directas, menos opciones, conceptos básicos
   - Medio: Requiere comprensión, más opciones, aplicación de conceptos
   - Difícil: Análisis crítico, todas las opciones plausibles, síntesis de información

3. **MATERIA**: Adapta los tipos de pregunta a la materia:
   - Matemáticas: fill_blanks para fórmulas, order_sequence para procedimientos
   - Historia: true_false para fechas, match_pairs para eventos-fechas, multiple_choice para causas-efectos
   - Ciencias: multiple_select para características, order_sequence para procesos, short_answer para definiciones
   - Lengua: fill_blanks para gramática, multiple_choice para comprensión

4. **CALIDAD**: 
   - Opciones incorrectas deben ser plausibles
   - Explicaciones claras y educativas
   - Lenguaje apropiado para el grado

**FORMATO JSON REQUERIDO:**

Responde ÚNICAMENTE con un objeto JSON válido (sin texto adicional, sin markdown):

{
  "titulo": "Título descriptivo del quiz",
  "descripcion": "Descripción breve del contenido",
  "preguntas": [
    {
      "texto": "¿Cuál es la función principal de la clorofila en las plantas?",
      "tipo": "multiple_choice",
      "opciones": [
        { "texto": "Capturar luz solar para fotosíntesis" },
        { "texto": "Transportar agua a las hojas" },
        { "texto": "Proteger contra plagas" },
        { "texto": "Producir oxígeno directamente" }
      ],
      "respuesta_correcta": ["0"],
      "puntos": 1000,
      "tiempo_limite": ${params.tiempo_por_pregunta},
      "explicacion": "La clorofila captura la energía lumínica del sol para realizar la fotosíntesis. Los distractores son funciones relacionadas pero incorrectas."
    },
    {
      "texto": "¿Verdadero o Falso: La fotosíntesis ocurre en las hojas?",
      "tipo": "true_false",
      "opciones": [
        { "texto": "Verdadero" },
        { "texto": "Falso" }
      ],
      "respuesta_correcta": "0",
      "puntos": 1000,
      "tiempo_limite": ${params.tiempo_por_pregunta},
      "explicacion": "Es verdadero porque..."
    },
    {
      "texto": "Completa: La capital de _____ es París y la de España es _____",
      "tipo": "fill_blanks",
      "opciones": [
        { "texto": "Francia" },
        { "texto": "Madrid" },
        { "texto": "Italia" },
        { "texto": "Londres" },
        { "texto": "Alemania" },
        { "texto": "Barcelona" }
      ],
      "respuesta_correcta": ["Francia", "Madrid"],
      "puntos": 1000,
      "tiempo_limite": ${params.tiempo_por_pregunta},
      "explicacion": "Francia tiene como capital París, y España tiene Madrid. Los distractores son países europeos y ciudades españolas para hacer la pregunta más desafiante."
    },
    {
      "texto": "¿Cuál es la capital de España?",
      "tipo": "short_answer",
      "opciones": [],
      "respuesta_correcta": "Madrid",
      "puntos": 1000,
      "tiempo_limite": ${params.tiempo_por_pregunta},
      "explicacion": "Madrid es la capital de España"
    },
    {
      "texto": "Selecciona todos los mamíferos:",
      "tipo": "multiple_select",
      "opciones": [
        { "texto": "Perro" },
        { "texto": "Pez" },
        { "texto": "Gato" },
        { "texto": "Águila" }
      ],
      "respuesta_correcta": ["0", "2"],
      "puntos": 1000,
      "tiempo_limite": ${params.tiempo_por_pregunta},
      "explicacion": "Perro y gato son mamíferos"
    },
    {
      "texto": "Ordena los pasos del ciclo del agua:",
      "tipo": "order_sequence",
      "opciones": [
        { "texto": "Precipitación" },
        { "texto": "Evaporación" },
        { "texto": "Condensación" },
        { "texto": "Infiltración" }
      ],
      "respuesta_correcta": ["1", "2", "0", "3"],
      "puntos": 1000,
      "tiempo_limite": ${params.tiempo_por_pregunta},
      "explicacion": "El ciclo del agua comienza con Evaporación (índice 1), luego Condensación (índice 2), Precipitación (índice 0), y finalmente Infiltración (índice 3). NOTA: Las opciones están DESORDENADAS intencionalmente para que el usuario las ordene."
    }
  ]
}

**RECUERDA:** 
- Usa una mezcla de tipos de preguntas para hacer el quiz más interesante y educativo.
- Para order_sequence: Las opciones DEBEN estar mezcladas, NO en el orden correcto.`;
  }

  /**
   * Obtener guías específicas de contenido según el grado escolar
   */
  private getGradeSpecificGuide(gradoName: string, materiaName: string): string {
    const gradeLower = gradoName.toLowerCase();
    
    // Determinar el nivel educativo
    if (gradeLower.includes('inicial') || gradeLower.includes('3 años') || gradeLower.includes('4 años') || gradeLower.includes('5 años')) {
      return `
**🚨 NIVEL INICIAL (3-5 AÑOS) - INSTRUCCIONES CRÍTICAS:**

**ESTE ES EL NIVEL MÁS BÁSICO DE EDUCACIÓN. Los niños están en edad preescolar.**

**CONTENIDO PERMITIDO:**
- **Ciencias:** Partes del cuerpo, 5 sentidos, animales domésticos comunes (perro, gato, pájaro), clima (sol, lluvia), día/noche, plantas simples (flores, árboles)
- **Matemáticas:** Números 1-10, contar objetos visibles, formas básicas (círculo, cuadrado, triángulo), tamaños (grande/pequeño), colores primarios
- **Comunicación:** Vocales, consonantes simples, saludos, identificar objetos cotidianos, acciones básicas (comer, dormir, jugar)
- **Social:** Familia (mamá, papá, hermanos), emociones básicas (feliz, triste, enojado), buenos modales, compartir

**VOCABULARIO:**
- Usar palabras EXTREMADAMENTE simples
- Frases cortas de máximo 8-10 palabras
- Evitar conceptos abstractos
- Relacionar TODO con su experiencia diaria y lo que pueden ver/tocar

**CONTENIDO PROHIBIDO:**
- ❌ Historia (fechas, personajes históricos, eventos)
- ❌ Geografía avanzada (países, capitales, continentes)
- ❌ Ciencia compleja (fotosíntesis, ciclos, procesos químicos)
- ❌ Matemáticas avanzadas (sumas/restas, números >20)
- ❌ Conceptos abstractos o que requieran razonamiento complejo
- ❌ Lectura de textos largos

**EJEMPLOS APROPIADOS:**
- ✅ "¿De qué color es el sol?" (amarillo)
- ✅ "¿Qué animal dice 'miau'?" (gato)
- ✅ "¿Cuántas manzanas hay?" (mostrar 3 manzanas)
- ✅ "¿Qué forma tiene una pelota?" (círculo)
- ✅ "¿Con qué parte del cuerpo escuchamos?" (orejas)

**EJEMPLOS PROHIBIDOS:**
- ❌ "¿Quién fue el líder de la revolución?"
- ❌ "¿Cuál es la capital de...?"
- ❌ "¿Qué es la fotosíntesis?"
- ❌ Cualquier pregunta sobre historia, geografía política, o conceptos abstractos`;
    }
    
    if (gradeLower.includes('1') || gradeLower.includes('primero') || gradeLower.includes('2') || gradeLower.includes('segundo') || gradeLower.includes('3') || gradeLower.includes('tercero')) {
      const grado = gradeLower.includes('1') || gradeLower.includes('primero') ? '1°' : 
                     gradeLower.includes('2') || gradeLower.includes('segundo') ? '2°' : '3°';
      return `
**📚 PRIMARIA INICIAL (${grado} - 6 a 8 años) - INSTRUCCIONES:**

**Estos niños están aprendiendo a leer y escribir. Mantén contenido simple y concreto.**

**CONTENIDO APROPIADO:**
- **Ciencias:** Seres vivos vs no vivos, partes de las plantas, animales y sus crías, hábitats básicos (agua, tierra, aire), estados del agua (sólido, líquido), estaciones del año
- **Matemáticas:** Números hasta 100, sumas/restas simples (<20), decenas/unidades, figuras geométricas, medición básica (largo/corto)
- **Lengua:** Vocales/consonantes, sílabas, sustantivos/verbos básicos, comprensión de cuentos cortos, familia de palabras
- **Historia:** Familia, comunidad, tradiciones locales, oficios básicos, antes/ahora
- **Geografía:** Mi ciudad, mi país (nivel básico), tipos de lugares (montaña, playa, ciudad)

**VOCABULARIO:**
- Frases simples de 10-15 palabras máximo
- Evitar tecnicismos
- Usar ejemplos visuales y concretos
- Relacionar con su entorno inmediato

**EVITAR:**
- ❌ Historia mundial compleja (guerras, revoluciones, personajes internacionales)
- ❌ Operaciones matemáticas complejas (multiplicación/división avanzada)
- ❌ Conceptos científicos abstractos
- ❌ Geografía detallada (todas las capitales, países lejanos)`;
    }
    
    if (gradeLower.includes('4') || gradeLower.includes('cuarto') || gradeLower.includes('5') || gradeLower.includes('quinto') || gradeLower.includes('6') || gradeLower.includes('sexto')) {
      const grado = gradeLower.includes('4') || gradeLower.includes('cuarto') ? '4°' : 
                     gradeLower.includes('5') || gradeLower.includes('quinto') ? '5°' : '6°';
      return `
**📖 PRIMARIA AVANZADA (${grado} - 9 a 11 años) - INSTRUCCIONES:**

**Estos niños pueden manejar conceptos más complejos pero aún necesitan ejemplos concretos.**

**CONTENIDO APROPIADO:**
- **Ciencias:** Ecosistemas, cadenas alimenticias, sistema solar, ciclo del agua, energía, magnetismo, cuerpo humano (sistemas básicos)
- **Matemáticas:** Multiplicación/división, fracciones simples, decimales básicos, perímetro/área, problemas con 2 operaciones
- **Lengua:** Tipos de textos, sinónimos/antónimos, comprensión lectora, gramática básica
- **Historia:** Historia nacional básica, personajes históricos locales, líneas de tiempo simples, civilizaciones antiguas (introducción)
- **Geografía:** Países vecinos, características geográficas, clima, recursos naturales

**VOCABULARIO:**
- Pueden manejar términos más técnicos pero con explicaciones
- Frases de complejidad media
- Introducir conceptos científicos con ejemplos

**EVITAR:**
- ❌ Historia mundial muy detallada (guerras mundiales, revoluciones extranjeras)
- ❌ Matemáticas de secundaria (álgebra, ecuaciones)
- ❌ Ciencia avanzada (química, física teórica)`;
    }
    
    if (gradeLower.includes('secundaria') || gradeLower.includes('1° sec') || gradeLower.includes('2° sec') || gradeLower.includes('3° sec') || 
        gradeLower.includes('7') || gradeLower.includes('séptimo') || gradeLower.includes('8') || gradeLower.includes('octavo') || 
        gradeLower.includes('9') || gradeLower.includes('noveno')) {
      return `
**🎓 SECUNDARIA (12 a 14 años) - INSTRUCCIONES:**

**Estudiantes con capacidad de pensamiento abstracto y análisis más profundo.**

**CONTENIDO APROPIADO:**
- **Ciencias:** Fotosíntesis, reacciones químicas básicas, leyes de Newton, electricidad, genética básica, célula
- **Matemáticas:** Álgebra básica, ecuaciones, geometría, probabilidad, estadística descriptiva
- **Historia:** Revoluciones, guerras mundiales, movimientos sociales, historia mundial
- **Geografía:** Todos los continentes, sistemas políticos, economía básica, globalización

**CARACTERÍSTICAS:**
- Pueden manejar conceptos abstractos
- Vocabulario técnico apropiado
- Análisis de causa-efecto
- Comparaciones y síntesis`;
    }
    
    // Por defecto (preparatoria/bachillerato)
    if (gradeLower.includes('preparatoria') || gradeLower.includes('bachillerato') || 
        gradeLower.includes('10') || gradeLower.includes('11') || gradeLower.includes('12')) {
      return `
**🎯 PREPARATORIA/BACHILLERATO (15 a 17 años) - INSTRUCCIONES:**

**Estudiantes con pensamiento crítico desarrollado y capacidad de análisis complejo.**

**CONTENIDO APROPIADO:**
- Todos los temas son apropiados
- Conceptos avanzados y abstractos
- Análisis crítico, síntesis, evaluación
- Vocabulario técnico y especializado
- Pensamiento científico y matemático avanzado`;
    }
    
    return `
**INSTRUCCIONES GENERALES DE CONTENIDO:**

Adapta el contenido al nivel educativo "${gradoName}":
- Usa vocabulario apropiado para la edad
- Ajusta la complejidad de los conceptos
- Relaciona con el mundo real del estudiante
- Incluye ejemplos concretos y relevantes`;
  }

  /**
   * Construir prompt para generación desde PDF con tipos variados
   */
  private buildPromptFromPDF(
    pdfText: string,
    params: Omit<AIGenerateQuizInput, 'prompt'>,
    materiaName: string,
    gradoName: string
  ): string {
    const difficultyMap = {
      facil: 'fácil',
      medio: 'medio',
      dificil: 'difícil',
    };

    // Determinar qué tipos de preguntas usar
    const allowedTypes = params.question_types && params.question_types.length > 0
      ? params.question_types
      : ['multiple_choice', 'multiple_select', 'true_false', 'short_answer', 'fill_blanks', 'order_sequence', 'match_pairs'];

    const typeRestriction = params.question_types && params.question_types.length > 0
      ? `\n**IMPORTANTE: El usuario ha solicitado SOLO estos tipos de preguntas: ${allowedTypes.join(', ')}**\nDEBES usar ÚNICAMENTE estos tipos. No uses otros tipos de preguntas.`
      : '\n**IMPORTANTE: Usa una VARIEDAD de tipos de preguntas. No uses solo multiple_choice.**';

    // Obtener guías específicas por grado
    const gradeGuide = this.getGradeSpecificGuide(gradoName, materiaName);

    return `Eres un experto en educación. He aquí el contenido de un documento PDF. Crea un quiz VARIADO E INTERACTIVO basado en este contenido.

**Contenido del documento:**
${pdfText}

**Especificaciones del quiz:**
- Materia: ${materiaName}
- Grado: ${gradoName}
- Dificultad: ${difficultyMap[params.dificultad]}
- Número de preguntas: ${params.num_questions}
${typeRestriction}

${gradeGuide}

**TIPOS DE PREGUNTAS A USAR:**

🚨 **FORMATO CRÍTICO:** Cada opción DEBE ser un objeto con "texto":
CORRECTO: { "texto": "Respuesta" }
INCORRECTO: "Respuesta"

1. multiple_choice - Una respuesta correcta
   - opciones: 4 objetos, cada uno con { "texto": "..." }
   - respuesta_correcta: ["0"]
   
2. multiple_select - Varias respuestas correctas
   - opciones: 4-6 objetos, cada uno con { "texto": "..." }
   - respuesta_correcta: ["0", "2"]
   
3. true_false - Verdadero/Falso
   - opciones: [{ "texto": "Verdadero" }, { "texto": "Falso" }]
   - respuesta_correcta: "0" (string)
   
4. short_answer - Respuesta corta
   - **opciones: [] (array vacío)**
   - respuesta_correcta: "palabra" (string)
   
5. fill_blanks - Completar espacios
   - opciones: 4-5 objetos, cada uno con { "texto": "palabra" }
   - respuesta_correcta: ["palabra1"]
   
6. order_sequence - Ordenar pasos
   - opciones: 3-5 objetos DESORDENADOS, cada uno con { "texto": "paso" }
   - respuesta_correcta: índices del orden correcto
   
7. match_pairs - Relacionar conceptos
   - opciones: pares en objetos con { "texto": "A -> B" }
   - respuesta_correcta: ["0", "1"]

**IMPORTANTE SOBRE DISTRACTORES:**
- Para multiple_choice y multiple_select: Las opciones incorrectas deben ser plausibles y relacionadas al tema
- Para fill_blanks: Incluye palabras similares o del mismo contexto como distractores
- Evita distractores obviamente incorrectos o sin sentido

**Instrucciones:**
1. Lee y analiza el contenido del documento
2. Crea ${params.num_questions} preguntas VARIADAS (usa diferentes tipos)
3. Las preguntas deben cubrir los conceptos clave del documento
4. Adapta los tipos de pregunta según:
   - Grado: ${gradoName} (más simples para menores, más complejas para mayores)
   - Dificultad: ${difficultyMap[params.dificultad]}
   - Contenido del PDF
5. Incluye explicaciones educativas

**FORMATOS POR TIPO:**
- multiple_choice: 2-4 opciones, respuesta_correcta: ["0"]
- multiple_select: 3-6 opciones, respuesta_correcta: ["0", "2"]
- true_false: 2 opciones fijas, respuesta_correcta: "0" o "1" (string)
- short_answer: opciones: [], respuesta_correcta: "palabra"
- fill_blanks: texto con _____, respuesta_correcta: ["palabra1", "palabra2"]
- order_sequence: 3-5 items, respuesta_correcta: ["0", "1", "2"]
- match_pairs: pares A->B, respuesta_correcta: ["0", "1", "2"]

Responde ÚNICAMENTE con un objeto JSON válido (sin texto adicional, sin markdown):

{
  "titulo": "Título basado en el contenido del PDF",
  "descripcion": "Descripción del contenido cubierto",
  "preguntas": [
    {
      "texto": "Pregunta variada...",
      "tipo": "multiple_choice",
      "opciones": [...],
      "respuesta_correcta": ["0"],
      "puntos": 1000,
      "tiempo_limite": ${params.tiempo_por_pregunta},
      "explicacion": "Explicación"
    }
  ]
}`;
  }

  /**
   * Llamar a la IA con retry logic y fallback automático
   */
  private async callAIWithRetry(
    config: any,
    prompt: string,
    maxRetries: number
  ): Promise<GeneratedQuizResponse> {
    let lastError: Error | null = null;

    // Primero intentar con el proveedor configurado
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.callAIProvider(config, prompt);
        return response;
      } catch (error: any) {
        lastError = error;
        
        // Si es error de API key o autenticación, no reintentar
        if (error.message.includes('API key') || error.message.includes('401')) {
          throw error;
        }

        // Si no es el último intento, esperar antes de reintentar
        if (attempt < maxRetries) {
          await this.delay(1000 * attempt); // Backoff exponencial
        }
      }
    }

    // Si todos los reintentos fallaron y el error es de sobrecarga, intentar fallback
    if (lastError && this.isOverloadError(lastError)) {
      return await this.tryFallbackProviders(config, prompt, lastError);
    }

    throw new Error(`Falló después de ${maxRetries} intentos: ${lastError?.message}`);
  }

  /**
   * Verificar si el error es por sobrecarga del servicio
   */
  private isOverloadError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return message.includes('overloaded') || 
           message.includes('rate limit') || 
           message.includes('too many requests') ||
           message.includes('503') ||
           message.includes('429');
  }

  /**
   * Intentar con proveedores alternativos usando configuración global
   */
  private async tryFallbackProviders(
    primaryConfig: any,
    prompt: string,
    primaryError: Error
  ): Promise<GeneratedQuizResponse> {
    // Orden de fallback: Gemini -> OpenAI -> Claude
    const fallbackOrder = ['gemini', 'openai', 'claude'].filter(p => p !== primaryConfig.provider);
    
    for (const provider of fallbackOrder) {
      try {
        
        // Obtener configuración global del sistema para el proveedor de fallback
        const fallbackConfig = await this.getSystemFallbackConfig(provider);
        
        if (!fallbackConfig || !fallbackConfig.api_key) {
          continue;
        }

        const response = await this.callAIProvider(fallbackConfig, prompt);
        
        return response;
      } catch (error: any) {
        continue;
      }
    }

    // Si todos los fallbacks fallaron, lanzar el error original
    throw new Error(
      `Todos los proveedores de IA fallaron. Error principal: ${primaryError.message}. ` +
      `Por favor intenta de nuevo en unos minutos o contacta al administrador.`
    );
  }

  /**
   * Obtener configuración de fallback del sistema (API keys globales)
   */
  private async getSystemFallbackConfig(provider: string): Promise<any | null> {
    try {
      // Buscar en configuración del sistema por claves como 'openai_fallback_key'
      const configKey = await prisma.configuracion_sistema.findUnique({
        where: { clave: `${provider}_fallback_key` },
      });

      if (!configKey || !configKey.valor) {
        return null;
      }

      // Parsear el valor que debe ser JSON con {api_key, model}
      let config: any;
      if (typeof configKey.valor === 'string') {
        config = JSON.parse(configKey.valor);
      } else {
        // Si ya es un objeto, usarlo directamente
        config = configKey.valor;
      }
      
      return {
        provider,
        api_key: config.api_key,
        model: config.model || this.getDefaultModel(provider),
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Obtener modelo por defecto según proveedor
   */
  private getDefaultModel(provider: string): string {
    const defaults: Record<string, string> = {
      openai: 'gpt-4o-mini',
      gemini: 'gemini-1.5-flash',
      claude: 'claude-3-haiku-20240307',
    };
    return defaults[provider] || 'gpt-4o-mini';
  }

  /**
   * Llamar al proveedor de IA específico
   */
  private async callAIProvider(config: any, prompt: string): Promise<GeneratedQuizResponse> {
    const provider = config.provider;
    const apiKey = config.api_key;
    const model = config.model;

    if (provider === 'openai') {
      return await this.callOpenAI(apiKey, model, prompt);
    } else if (provider === 'gemini') {
      return await this.callGemini(apiKey, model, prompt);
    } else if (provider === 'claude') {
      return await this.callClaude(apiKey, model, prompt);
    } else {
      throw new Error(`Proveedor no soportado: ${provider}`);
    }
  }

  /**
   * Llamar a OpenAI API
   */
  private async callOpenAI(apiKey: string, model: string, prompt: string): Promise<GeneratedQuizResponse> {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente experto en educación que genera quizzes en formato JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API Error: ${error.error?.message || response.statusText}`);
    }

    const data: any = await response.json();
    const content = data.choices[0].message.content;
    
    return JSON.parse(content);
  }

  /**
   * Llamar a Google Gemini API
   */
  private async callGemini(apiKey: string, model: string, prompt: string): Promise<GeneratedQuizResponse> {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini API Error: ${error.error?.message || response.statusText}`);
    }

    const data: any = await response.json();
    const content = data.candidates[0].content.parts[0].text;
    
    // Limpiar markdown si existe
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    return JSON.parse(jsonStr);
  }

  /**
   * Llamar a Anthropic Claude API
   */
  private async callClaude(apiKey: string, model: string, prompt: string): Promise<GeneratedQuizResponse> {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Claude API Error: ${error.error?.message || response.statusText}`);
    }

    const data: any = await response.json();
    const content = data.content[0].text;
    
    // Limpiar markdown si existe
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    return JSON.parse(jsonStr);
  }

  /**
   * Validar estructura de quiz generado con múltiples tipos
   */
  private validateGeneratedQuiz(data: any): void {
    if (!data.titulo || typeof data.titulo !== 'string') {
      throw new Error('El quiz generado no tiene un título válido');
    }

    if (!data.preguntas || !Array.isArray(data.preguntas)) {
      throw new Error('El quiz generado no tiene preguntas válidas');
    }

    if (data.preguntas.length < 5) {
      throw new Error('El quiz debe tener al menos 5 preguntas');
    }

    const validTypes = ['multiple_choice', 'multiple_select', 'true_false', 'short_answer', 'fill_blanks', 'order_sequence', 'match_pairs'];

    // Validar cada pregunta
    data.preguntas.forEach((q: any, index: number) => {
      if (!q.texto || typeof q.texto !== 'string') {
        throw new Error(`Pregunta ${index + 1}: texto inválido`);
      }

      // Validar tipo de pregunta
      if (!q.tipo || !validTypes.includes(q.tipo)) {
        throw new Error(`Pregunta ${index + 1}: tipo de pregunta inválido (${q.tipo})`);
      }

      // Validaciones específicas por tipo
      if (q.tipo === 'short_answer') {
        // short_answer DEBE tener opciones vacías
        if (q.opciones && q.opciones.length > 0) {
          q.opciones = [];
        }
        if (!q.respuesta_correcta || typeof q.respuesta_correcta !== 'string') {
          throw new Error(`Pregunta ${index + 1}: short_answer requiere respuesta_correcta como string`);
        }
      } else if (q.tipo === 'true_false') {
        // true_false debe tener exactamente 2 opciones
        if (!q.opciones || q.opciones.length !== 2) {
          throw new Error(`Pregunta ${index + 1}: true_false debe tener exactamente 2 opciones`);
        }
        
        // Validar que cada opción tenga el campo texto
        q.opciones.forEach((opcion: any, opcionIndex: number) => {
          if (!opcion || typeof opcion !== 'object') {
            throw new Error(`Pregunta ${index + 1}, Opción ${opcionIndex + 1}: debe ser un objeto`);
          }
          if (!opcion.texto || typeof opcion.texto !== 'string' || opcion.texto.trim() === '') {
            throw new Error(`Pregunta ${index + 1}, Opción ${opcionIndex + 1}: debe tener un campo 'texto' válido`);
          }
        });
        
        if (typeof q.respuesta_correcta !== 'string') {
          throw new Error(`Pregunta ${index + 1}: true_false requiere respuesta_correcta como string`);
        }
      } else if (q.tipo === 'fill_blanks') {
        // fill_blanks debe tener mínimo 3 opciones (incluye correctas + distractoras)
        if (!q.opciones || !Array.isArray(q.opciones) || q.opciones.length < 3 || q.opciones.length > 6) {
          throw new Error(`Pregunta ${index + 1} (fill_blanks): debe tener entre 3 y 6 opciones disponibles`);
        }
        
        // Validar que cada opción tenga el campo texto
        q.opciones.forEach((opcion: any, opcionIndex: number) => {
          if (!opcion || typeof opcion !== 'object') {
            throw new Error(`Pregunta ${index + 1}, Opción ${opcionIndex + 1}: debe ser un objeto`);
          }
          if (!opcion.texto || typeof opcion.texto !== 'string' || opcion.texto.trim() === '') {
            throw new Error(`Pregunta ${index + 1}, Opción ${opcionIndex + 1}: debe tener un campo 'texto' válido`);
          }
        });
        
        // Validar respuesta para fill_blanks
        if (!Array.isArray(q.respuesta_correcta) || q.respuesta_correcta.length === 0) {
          throw new Error(`Pregunta ${index + 1}: fill_blanks requiere respuesta_correcta como array de strings`);
        }
        // Validar que haya espacios en blanco en el texto
        const blanksCount = (q.texto.match(/_____/g) || []).length;
        if (blanksCount === 0) {
          throw new Error(`Pregunta ${index + 1}: fill_blanks requiere _____ en el texto`);
        }
        // Validar que las respuestas correctas coincidan con los espacios
        if (q.respuesta_correcta.length !== blanksCount) {
          throw new Error(`Pregunta ${index + 1}: fill_blanks tiene ${blanksCount} espacios pero ${q.respuesta_correcta.length} respuestas`);
        }
      } else {
        // Otros tipos (multiple_choice, multiple_select, order_sequence, match_pairs) requieren 2-6 opciones
        if (!q.opciones || !Array.isArray(q.opciones) || q.opciones.length < 2 || q.opciones.length > 6) {
          throw new Error(`Pregunta ${index + 1} (${q.tipo}): debe tener entre 2 y 6 opciones`);
        }
        
        // Validar que cada opción tenga el campo texto
        q.opciones.forEach((opcion: any, opcionIndex: number) => {
          if (!opcion || typeof opcion !== 'object') {
            throw new Error(`Pregunta ${index + 1}, Opción ${opcionIndex + 1}: debe ser un objeto`);
          }
          if (!opcion.texto || typeof opcion.texto !== 'string' || opcion.texto.trim() === '') {
            throw new Error(`Pregunta ${index + 1}, Opción ${opcionIndex + 1}: debe tener un campo 'texto' válido`);
          }
        });
        
        // Validar respuesta_correcta para otros tipos
        if (!Array.isArray(q.respuesta_correcta) || q.respuesta_correcta.length === 0) {
          throw new Error(`Pregunta ${index + 1}: respuesta_correcta inválida`);
        }

        // Para tipos con índices, validar que existan las opciones
        if (['multiple_choice', 'multiple_select', 'order_sequence', 'match_pairs'].includes(q.tipo)) {
          const indices = Array.isArray(q.respuesta_correcta) ? q.respuesta_correcta : [q.respuesta_correcta];
          indices.forEach((idx: any) => {
            const correctIndex = parseInt(idx);
            if (isNaN(correctIndex) || correctIndex < 0 || correctIndex >= q.opciones.length) {
              throw new Error(`Pregunta ${index + 1}: índice de respuesta correcta fuera de rango (${idx})`);
            }
          });
        }
      }
    });
  }

  /**
   * Crear quiz en la BD desde datos generados
   */
  private async createQuizFromGenerated(
    userId: string,
    data: GeneratedQuizResponse,
    params: AIGenerateQuizInput,
    provider: string
  ): Promise<string> {
    // Crear quiz
    const quiz = await prisma.quizzes.create({
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion || '',
        creador_id: userId,
        materia_id: params.materia_id,
        grado_id: params.grado_id,
        tipo_quiz: params.tipo_quiz || 'kahoot',
        dificultad: params.dificultad,
        tiempo_por_pregunta: params.tiempo_por_pregunta || 20,
        puntos_base: 1000,
        bonificacion_velocidad: true,
        bonificacion_combo: true,
        estado: 'borrador',
        origen: null,
        metadatos_origen: {
          provider,
          generated_at: new Date().toISOString(),
          original_prompt: params.prompt,
        } as any,
        tags: [],
        palabras_clave: [],
      },
    });

    // Crear preguntas
    const preguntasData = data.preguntas.map((pregunta, index) => ({
      quiz_id: quiz.id,
      orden: index + 1,
      texto: pregunta.texto,
      tipo: pregunta.tipo || 'multiple_choice',
      opciones: pregunta.opciones as any,
      respuesta_correcta: pregunta.respuesta_correcta as any,
      puntos: pregunta.puntos || 1000,
      tiempo_limite: pregunta.tiempo_limite || params.tiempo_por_pregunta || 20,
      explicacion: pregunta.explicacion,
    }));

    await prisma.preguntas.createMany({
      data: preguntasData,
    });

    return quiz.id;
  }

  /**
   * Estimar tokens usados (aproximado)
   */
  private estimateTokens(prompt: string, response: string): number {
    // Estimación simple: ~4 caracteres = 1 token
    const promptTokens = Math.ceil(prompt.length / 4);
    const responseTokens = Math.ceil(response.length / 4);
    return promptTokens + responseTokens;
  }

  /**
   * Estimar costo (aproximado en USD)
   */
  private estimateCost(provider: string, tokens: number): number {
    // Costos aproximados por 1K tokens (promedio input + output)
    const costPer1K: Record<string, number> = {
      openai: 0.015, // GPT-4o
      gemini: 0.001, // Gemini 1.5 Pro
      claude: 0.015, // Claude 3.5 Sonnet
    };

    const rate = costPer1K[provider] || 0.01;
    return (tokens / 1000) * rate;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
