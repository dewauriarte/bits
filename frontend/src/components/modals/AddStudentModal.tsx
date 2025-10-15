import { useState, useEffect } from 'react';
import { Search, UserPlus, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { classesApi } from '@/lib/api/classes';
import { toast } from 'sonner';

interface AddStudentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classId: string;
  className: string;
}

export default function AddStudentModal({
  open,
  onClose,
  onSuccess,
  classId,
  className,
}: AddStudentModalProps) {
  const [loading, setLoading] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const [foundStudent, setFoundStudent] = useState<any>(null);
  const [mode, setMode] = useState<'search' | 'create'>('search');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Form data para crear nuevo estudiante
  const [newStudent, setNewStudent] = useState({
    username: '',
    nombre: '',
    apellido: '',
  });

  // Búsqueda en tiempo real
  useEffect(() => {
    const searchDebounce = setTimeout(async () => {
      if (searchUsername.trim().length >= 2) {
        try {
          setSearching(true);
          const response = await classesApi.searchStudents(searchUsername.trim());
          setSuggestions(response.data || []);
        } catch (error) {
          console.error('Error searching:', error);
          setSuggestions([]);
        } finally {
          setSearching(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(searchDebounce);
  }, [searchUsername]);

  const handleSelectSuggestion = (student: any) => {
    setFoundStudent(student);
    setSuggestions([]);
    setSearchUsername('');
  };

  const handleAddExisting = async () => {
    if (!foundStudent) return;

    try {
      setLoading(true);
      await classesApi.addExistingStudent(classId, foundStudent.id);
      toast.success(`${foundStudent.nombre} agregado a la clase`);
      onSuccess();
      handleClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al agregar estudiante');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    if (!newStudent.username || !newStudent.nombre || !newStudent.apellido) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    try {
      setLoading(true);
      const response = await classesApi.createStudent(classId, newStudent);
      toast.success(
        <div>
          <p className="font-semibold">¡Estudiante creado!</p>
          <p className="text-sm">Contraseña: <strong>{response.data.password}</strong></p>
        </div>,
        { duration: 5000 }
      );
      onSuccess();
      handleClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear estudiante');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSearchUsername('');
      setFoundStudent(null);
      setMode('search');
      setNewStudent({ username: '', nombre: '', apellido: '' });
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Agregar Estudiante</DialogTitle>
          <DialogDescription>
            Agrega un estudiante a la clase <strong>{className}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tabs de modo */}
          <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setMode('search')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === 'search'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🔍 Buscar Existente
            </button>
            <button
              onClick={() => setMode('create')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === 'create'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ➕ Crear Nuevo
            </button>
          </div>

          {/* Modo: Buscar */}
          {mode === 'search' && (
            <div className="space-y-4">
              <div className="relative">
                <Label htmlFor="search-username">Buscar Estudiante</Label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search-username"
                    value={searchUsername}
                    onChange={(e) => setSearchUsername(e.target.value)}
                    placeholder="Escribe nombre, apellido o username..."
                    disabled={loading}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Busca por nombre, apellido o username</p>

                {/* Sugerencias en tiempo real */}
                {suggestions.length > 0 && !foundStudent && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {suggestions.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => handleSelectSuggestion(student)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                      >
                        <p className="font-medium text-gray-900">
                          {student.nombre} {student.apellido}
                        </p>
                        <p className="text-sm text-gray-600">@{student.username}</p>
                      </button>
                    ))}
                  </div>
                )}

                {/* Mensaje de búsqueda */}
                {searching && (
                  <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                    Buscando...
                  </div>
                )}

                {/* No hay resultados */}
                {searchUsername.length >= 2 && suggestions.length === 0 && !searching && !foundStudent && (
                  <div className="mt-2 text-sm text-gray-500">
                    No se encontraron estudiantes. Puedes crear uno nuevo en la pestaña "Crear Nuevo".
                  </div>
                )}
              </div>

              {/* Estudiante seleccionado */}
              {foundStudent && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-900 mb-2">
                        ✅ Estudiante Encontrado
                      </h4>
                      <div className="space-y-1 text-sm text-green-800">
                        <p><strong>Username:</strong> {foundStudent.username}</p>
                        <p><strong>Nombre:</strong> {foundStudent.nombre} {foundStudent.apellido}</p>
                      </div>
                      <Button
                        onClick={handleAddExisting}
                        className="mt-3 w-full"
                        disabled={loading}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        {loading ? 'Agregando...' : 'Agregar a la Clase'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Modo: Crear Nuevo */}
          {mode === 'create' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>ℹ️ Nota:</strong> El estudiante recibirá la contraseña: <strong>1234</strong>
                </p>
              </div>

              <div>
                <Label htmlFor="new-username">
                  Username <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="new-username"
                  value={newStudent.username}
                  onChange={(e) => setNewStudent({ ...newStudent, username: e.target.value })}
                  placeholder="estudiante1"
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="new-nombre">
                  Nombre <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="new-nombre"
                  value={newStudent.nombre}
                  onChange={(e) => setNewStudent({ ...newStudent, nombre: e.target.value })}
                  placeholder="Juan"
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="new-apellido">
                  Apellido <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="new-apellido"
                  value={newStudent.apellido}
                  onChange={(e) => setNewStudent({ ...newStudent, apellido: e.target.value })}
                  placeholder="Pérez"
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <Button
                onClick={handleCreateNew}
                className="w-full"
                disabled={loading || !newStudent.username || !newStudent.nombre || !newStudent.apellido}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {loading ? 'Creando...' : 'Crear y Agregar a la Clase'}
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
