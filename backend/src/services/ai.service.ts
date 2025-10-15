import prisma from '../config/database';
import { AIConfigService } from './aiConfig.service';
import { AIGenerateQuizInput } from '../schemas/quiz.schema';
// pdf-parse doesn't have proper ES module support, use require
const pdfParse = require('pdf-parse');

interface GeneratedQuestion {
  texto: string;
  tipo: 'multiple_choice' | 'true_false';
  opciones: { texto: string; imagen_url?: string }[];
  respuesta_correcta: string[];
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
   * Construir prompt optimizado para generación
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

    return `Eres un experto en educación creando un quiz educativo. Genera un quiz con las siguientes especificaciones:

**Contexto:**
- Materia: ${materiaName}
- Grado: ${gradoName}
- Dificultad: ${difficultyMap[params.dificultad]}
- Número de preguntas: ${params.num_questions}
- Tema: ${params.prompt}

**Instrucciones:**
1. Crea preguntas variadas y educativas sobre el tema
2. Cada pregunta debe tener entre 2 y 4 opciones
3. Solo UNA opción es correcta
4. Las opciones incorrectas deben ser plausibles pero claramente incorrectas
5. Incluye una breve explicación de la respuesta correcta
6. Usa lenguaje apropiado para el nivel de grado

**IMPORTANTE:** Responde ÚNICAMENTE con un objeto JSON válido en el siguiente formato (sin texto adicional):

{
  "titulo": "Título descriptivo del quiz",
  "descripcion": "Descripción breve del contenido",
  "preguntas": [
    {
      "texto": "¿Pregunta aquí?",
      "tipo": "multiple_choice",
      "opciones": [
        { "texto": "Opción A" },
        { "texto": "Opción B" },
        { "texto": "Opción C" },
        { "texto": "Opción D" }
      ],
      "respuesta_correcta": ["0"],
      "puntos": 1000,
      "tiempo_limite": ${params.tiempo_por_pregunta},
      "explicacion": "Breve explicación de por qué esta es la respuesta correcta"
    }
  ]
}

Nota: respuesta_correcta es un array con el índice de la opción correcta como string ("0", "1", "2", etc.)`;
  }

  /**
   * Construir prompt para generación desde PDF
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

    return `Eres un experto en educación. He aquí el contenido de un documento PDF. Crea un quiz basado en este contenido.

**Contenido del documento:**
${pdfText}

**Especificaciones del quiz:**
- Materia: ${materiaName}
- Grado: ${gradoName}
- Dificultad: ${difficultyMap[params.dificultad]}
- Número de preguntas: ${params.num_questions}

**Instrucciones:**
1. Lee y analiza el contenido del documento
2. Crea ${params.num_questions} preguntas basadas en los conceptos clave del documento
3. Las preguntas deben cubrir diferentes secciones/temas del documento
4. Cada pregunta debe tener 2-4 opciones
5. Solo UNA opción correcta
6. Incluye explicaciones breves

Responde ÚNICAMENTE con un objeto JSON válido (sin texto adicional):

{
  "titulo": "Título basado en el contenido del PDF",
  "descripcion": "Descripción del contenido cubierto",
  "preguntas": [
    {
      "texto": "¿Pregunta basada en el documento?",
      "tipo": "multiple_choice",
      "opciones": [
        { "texto": "Opción A" },
        { "texto": "Opción B" },
        { "texto": "Opción C" }
      ],
      "respuesta_correcta": ["0"],
      "puntos": 1000,
      "tiempo_limite": ${params.tiempo_por_pregunta},
      "explicacion": "Explicación breve"
    }
  ]
}`;
  }

  /**
   * Llamar a la IA con retry logic
   */
  private async callAIWithRetry(
    config: any,
    prompt: string,
    maxRetries: number
  ): Promise<GeneratedQuizResponse> {
    let lastError: Error | null = null;

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

    throw new Error(`Falló después de ${maxRetries} intentos: ${lastError?.message}`);
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
   * Validar estructura de quiz generado
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

    // Validar cada pregunta
    data.preguntas.forEach((q: any, index: number) => {
      if (!q.texto || typeof q.texto !== 'string') {
        throw new Error(`Pregunta ${index + 1}: texto inválido`);
      }

      if (!q.opciones || !Array.isArray(q.opciones) || q.opciones.length < 2 || q.opciones.length > 6) {
        throw new Error(`Pregunta ${index + 1}: debe tener entre 2 y 6 opciones`);
      }

      if (!q.respuesta_correcta || !Array.isArray(q.respuesta_correcta) || q.respuesta_correcta.length === 0) {
        throw new Error(`Pregunta ${index + 1}: respuesta_correcta inválida`);
      }

      // Validar que el índice de respuesta correcta existe
      const correctIndex = parseInt(q.respuesta_correcta[0]);
      if (isNaN(correctIndex) || correctIndex < 0 || correctIndex >= q.opciones.length) {
        throw new Error(`Pregunta ${index + 1}: índice de respuesta correcta fuera de rango`);
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
