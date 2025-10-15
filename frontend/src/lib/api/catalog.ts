import apiClient from '../api';

export interface Grado {
  id: string;
  nombre: string;
  nivel: string;
  orden: number;
}

export interface Materia {
  id: string;
  nombre: string;
  icono: string | null;
}

export const catalogApi = {
  // GET grados
  getGrados: async () => {
    const response = await apiClient.get('/api/catalog/grados');
    return response.data;
  },

  // GET materias
  getMaterias: async () => {
    const response = await apiClient.get('/api/catalog/materias');
    return response.data;
  },
};
