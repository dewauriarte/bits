import apiClient from '../api';

export interface CreateClassData {
  nombre: string;
  descripcion?: string;
  grado_id: string;
  materia_id: string;
  anio_escolar: string;
}

export interface UpdateClassData {
  nombre?: string;
  descripcion?: string;
  grado_id?: string;
  materia_id?: string;
  anio_escolar?: string;
  activo?: boolean;
}

export interface JoinClassData {
  codigo: string;
}

export const classesApi = {
  // GET /api/classes - Listar clases del profesor
  getClasses: async (params?: {
    grado_id?: string;
    materia_id?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    const response = await apiClient.get('/api/classes', { params });
    return response.data;
  },

  // POST /api/classes - Crear clase
  createClass: async (data: CreateClassData) => {
    const response = await apiClient.post('/api/classes', data);
    return response.data;
  },

  // GET /api/classes/:id - Detalle de clase
  getClassById: async (id: string) => {
    const response = await apiClient.get(`/api/classes/${id}`);
    return response.data;
  },

  // PUT /api/classes/:id - Actualizar clase
  updateClass: async (id: string, data: UpdateClassData) => {
    const response = await apiClient.put(`/api/classes/${id}`, data);
    return response.data;
  },

  // DELETE /api/classes/:id - Archivar clase
  deleteClass: async (id: string) => {
    const response = await apiClient.delete(`/api/classes/${id}`);
    return response.data;
  },

  // POST /api/classes/join - Unirse a clase (estudiante)
  joinClass: async (data: JoinClassData) => {
    const response = await apiClient.post('/api/classes/join', data);
    return response.data;
  },

  // GET /api/classes/:id/students - Listar estudiantes
  getClassStudents: async (id: string) => {
    const response = await apiClient.get(`/api/classes/${id}/students`);
    return response.data;
  },

  // DELETE /api/classes/:id/students/:studentId - Remover estudiante
  removeStudent: async (classId: string, studentId: string) => {
    const response = await apiClient.delete(`/api/classes/${classId}/students/${studentId}`);
    return response.data;
  },

  // GET /api/classes/:id/stats - Estadísticas de clase
  getClassStats: async (id: string) => {
    const response = await apiClient.get(`/api/classes/${id}/stats`);
    return response.data;
  },

  // GET /api/students/classes - Mis clases (estudiante)
  getMyClasses: async () => {
    const response = await apiClient.get('/api/students/classes');
    return response.data;
  },

  // POST /api/classes/:id/import-students - Importar estudiantes
  importStudents: async (classId: string, students: any[]) => {
    const response = await apiClient.post(`/api/classes/${classId}/import-students`, { students });
    return response.data;
  },

  // GET /api/classes/template/download - Descargar plantilla
  downloadTemplate: () => {
    return `${apiClient.defaults.baseURL}/api/classes/template/download`;
  },

  // GET /api/students/search - Buscar estudiantes (autocompletado)
  searchStudents: async (query: string) => {
    const response = await apiClient.get('/api/students/search', { params: { q: query } });
    return response.data;
  },

  // GET /api/students/search/:username - Buscar estudiante
  searchStudent: async (username: string) => {
    const response = await apiClient.get(`/api/students/search/${username}`);
    return response.data;
  },

  // POST /api/classes/:id/add-student - Agregar estudiante existente
  addExistingStudent: async (classId: string, estudianteId: string) => {
    const response = await apiClient.post(`/api/classes/${classId}/add-student`, { estudianteId });
    return response.data;
  },

  // POST /api/classes/:id/create-student - Crear nuevo estudiante
  createStudent: async (classId: string, data: { username: string; nombre: string; apellido: string }) => {
    const response = await apiClient.post(`/api/classes/${classId}/create-student`, data);
    return response.data;
  },
};
