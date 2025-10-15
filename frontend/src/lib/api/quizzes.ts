import apiClient from '../api';

export interface Quiz {
  id: string;
  titulo: string;
  descripcion?: string;
  creador_id: string;
  materia_id: string;
  grado_id: string;
  tags: string[];
  palabras_clave: string[];
  imagen_portada?: string;
  tipo_quiz: 'kahoot' | 'mario_party' | 'duelo';
  dificultad?: 'facil' | 'medio' | 'dificil';
  puntos_base: number;
  bonificacion_velocidad: boolean;
  bonificacion_combo: boolean;
  tiempo_por_pregunta: number;
  estado: 'borrador' | 'publicado' | 'archivado';
  origen?: string;
  veces_jugado: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
  grados?: { nombre: string };
  materias?: { nombre: string };
  num_preguntas?: number;
}

export interface Question {
  id: string;
  quiz_id: string;
  orden: number;
  texto: string;
  imagen_url?: string;
  video_url?: string;
  audio_url?: string;
  tipo: 'multiple_choice' | 'true_false' | 'texto_libre';
  opciones: { texto: string; imagen_url?: string }[];
  respuesta_correcta: string | string[];
  puntos: number;
  tiempo_limite: number;
  explicacion?: string;
  imagen_explicacion?: string;
}

export interface CreateQuizInput {
  titulo: string;
  descripcion?: string;
  materia_id: string;
  grado_id: string;
  tags?: string[];
  palabras_clave?: string[];
  imagen_portada?: string;
  tipo_quiz?: 'kahoot' | 'mario_party' | 'duelo';
  dificultad?: 'facil' | 'medio' | 'dificil';
  puntos_base?: number;
  bonificacion_velocidad?: boolean;
  bonificacion_combo?: boolean;
  tiempo_por_pregunta?: number;
  configuracion?: any;
}

export interface CreateQuestionInput {
  texto: string;
  imagen_url?: string;
  video_url?: string;
  audio_url?: string;
  tipo?: 'multiple_choice' | 'true_false' | 'texto_libre';
  opciones: { texto: string; imagen_url?: string }[];
  respuesta_correcta: string | string[];
  puntos?: number;
  tiempo_limite?: number;
  explicacion?: string;
  imagen_explicacion?: string;
}

export interface AIGenerateInput {
  prompt: string;
  num_questions: number;
  grado_id: string;
  materia_id: string;
  dificultad: 'facil' | 'medio' | 'dificil';
  tipo_quiz?: 'kahoot' | 'mario_party' | 'duelo';
  tiempo_por_pregunta?: number;
}

export const quizzesApi = {
  // GET /api/quizzes - Listar quizzes
  getQuizzes: (params?: {
    estado?: 'borrador' | 'publicado' | 'archivado';
    materia_id?: string;
    grado_id?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => apiClient.get('/api/quizzes', { params }),

  // GET /api/quizzes/:id - Detalle de quiz
  getQuiz: (id: string) => apiClient.get(`/api/quizzes/${id}`),

  // POST /api/quizzes - Crear quiz
  createQuiz: (data: CreateQuizInput) => apiClient.post('/api/quizzes', data),

  // PUT /api/quizzes/:id - Actualizar quiz
  updateQuiz: (id: string, data: Partial<CreateQuizInput>) =>
    apiClient.put(`/api/quizzes/${id}`, data),

  // DELETE /api/quizzes/:id - Archivar quiz
  deleteQuiz: (id: string) => apiClient.delete(`/api/quizzes/${id}`),

  // POST /api/quizzes/:id/publish - Publicar quiz
  publishQuiz: (id: string) => apiClient.post(`/api/quizzes/${id}/publish`),

  // POST /api/quizzes/:id/questions - Crear pregunta
  createQuestion: (quizId: string, data: CreateQuestionInput) =>
    apiClient.post(`/api/quizzes/${quizId}/questions`, data),

  // PUT /api/quizzes/:quizId/questions/:questionId - Actualizar pregunta
  updateQuestion: (quizId: string, questionId: string, data: Partial<CreateQuestionInput>) =>
    apiClient.put(`/api/quizzes/${quizId}/questions/${questionId}`, data),

  // DELETE /api/quizzes/:quizId/questions/:questionId - Eliminar pregunta
  deleteQuestion: (quizId: string, questionId: string) =>
    apiClient.delete(`/api/quizzes/${quizId}/questions/${questionId}`),

  // PUT /api/quizzes/:id/questions/reorder - Reordenar preguntas
  reorderQuestions: (quizId: string, questionIds: string[]) =>
    apiClient.put(`/api/quizzes/${quizId}/questions/reorder`, { question_ids: questionIds }),
};

export const aiApi = {
  // POST /api/ai/generate-quiz - Generar quiz desde prompt
  generateQuiz: (data: AIGenerateInput) => apiClient.post('/api/ai/generate-quiz', data),

  // POST /api/ai/generate-from-pdf - Generar quiz desde PDF
  generateFromPDF: (formData: FormData) =>
    apiClient.post('/api/ai/generate-from-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
};
