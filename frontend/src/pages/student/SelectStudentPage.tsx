import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import apiClient from '@/lib/api';

interface Student {
  id: string;
  userId: string;
  nickname: string;
  avatar: string;
}

const AVAILABLE_AVATARS = [
  '😀', '😎', '🤓', '🥳', '😺', '🐶', '🐼', '🐯', 
  '🦁', '🐸', '🐙', '🦄', '🦊', '🐨', '🐮', '🐷',
  '🚀', '⚡', '🌟', '🔥', '💎', '🏆', '🎮', '🎨'
];

export const SelectStudentPage = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVAILABLE_AVATARS[0]);
  const [usedAvatars, setUsedAvatars] = useState<string[]>([]);

  useEffect(() => {
    loadStudents();
  }, [code]);

  // Ajustar avatar seleccionado si ya no está disponible
  useEffect(() => {
    if (usedAvatars.length > 0 && usedAvatars.includes(selectedAvatar)) {
      const availableAvatars = AVAILABLE_AVATARS.filter(a => !usedAvatars.includes(a));
      if (availableAvatars.length > 0) {
        setSelectedAvatar(availableAvatars[0]);
      }
    }
  }, [usedAvatars, selectedAvatar]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/rooms/${code}/students`);
      const studentsList = response.data.data.students;
      setStudents(studentsList);
      
      // Obtener avatares ya usados en la sala (endpoint público)
      try {
        const roomInfoResponse = await apiClient.get(`/api/rooms/${code}`);
        const usedAvatars = roomInfoResponse.data.data.usedAvatars || [];
        setUsedAvatars(usedAvatars);
      } catch (error) {
        console.error('Error loading room info:', error);
        setUsedAvatars([]);
      }
    } catch (error: any) {
      toast.error('Error al cargar estudiantes', {
        description: error.response?.data?.message || 'Intenta de nuevo',
      });
      navigate('/student/join');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
  };

  const handleContinue = () => {
    if (!selectedStudent) {
      toast.error('Selecciona tu nombre de la lista');
      return;
    }

    // Crear token temporal
    const tempToken = `temp_${code}_${Date.now()}_${Math.random().toString(36)}`;
    localStorage.setItem('auth_token', tempToken);
    localStorage.setItem('session_type', 'anonymous');

    // Guardar datos del estudiante seleccionado con avatar personalizado
    const joinData = {
      roomCode: code,
      nickname: selectedStudent.nickname,
      avatar: selectedAvatar, // Avatar personalizado
      participantId: selectedStudent.id, // ID del participante pre-cargado
      userId: selectedStudent.userId,
    };
    
    sessionStorage.setItem('pending_join', JSON.stringify(joinData));

    // Ir directamente al lobby
    navigate(`/game/${code}/lobby`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Cargando estudiantes...</p>
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl mb-4">😔</div>
            <h2 className="text-xl font-bold mb-2">No hay estudiantes disponibles</h2>
            <p className="text-gray-600 mb-4">
              Todos los estudiantes ya se han unido o la sala no está disponible.
            </p>
            <Button onClick={() => navigate('/student/join')}>
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
      <div className="container mx-auto max-w-4xl py-8">
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">🎓</div>
            <CardTitle className="text-3xl">Selecciona tu nombre</CardTitle>
            <p className="text-gray-600 mt-2">
              Encuentra tu nombre en la lista de estudiantes
            </p>
          </CardHeader>
        </Card>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((student) => (
                <button
                  key={student.id}
                  onClick={() => handleSelectStudent(student)}
                  className={`
                    p-6 rounded-lg border-2 transition-all
                    ${selectedStudent?.id === student.id
                      ? 'border-indigo-500 bg-indigo-50 shadow-lg scale-105'
                      : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
                    }
                  `}
                >
                  <div className="text-center">
                    <div className="text-6xl mb-3">{student.avatar}</div>
                    <h3 className="font-bold text-lg text-gray-900">
                      {student.nickname}
                    </h3>
                    {selectedStudent?.id === student.id && (
                      <div className="mt-2 text-indigo-600 font-semibold">
                        ✓ Seleccionado
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Selector de Avatar - Solo visible si ya seleccionó nombre */}
        {selectedStudent && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-center">Personaliza tu Avatar 🎨</CardTitle>
              <p className="text-gray-600 text-center text-sm mt-2">
                Selecciona el avatar que te represente
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-3 mb-6">
                {AVAILABLE_AVATARS
                  .filter(avatar => !usedAvatars.includes(avatar)) // Filtrar avatares ya usados
                  .map((avatar, index) => (
                    <motion.button
                      key={avatar}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`
                        text-4xl p-3 rounded-lg transition-all
                        ${selectedAvatar === avatar
                          ? 'bg-indigo-100 ring-4 ring-indigo-500 scale-110'
                          : 'bg-gray-50 hover:bg-gray-100 hover:scale-105'
                        }
                      `}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.02 }}
                      whileHover={{ scale: selectedAvatar === avatar ? 1.1 : 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {avatar}
                    </motion.button>
                  ))}
              </div>

              {/* Preview */}
              <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6">
                <Label className="text-sm text-gray-600 mb-3 block text-center">
                  Vista Previa
                </Label>
                <div className="flex items-center justify-center space-x-4">
                  <div className="text-6xl">{selectedAvatar}</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedStudent.nickname}
                  </div>
                </div>
              </Card>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/student/join')}
            className="flex-1"
          >
            ← Volver
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!selectedStudent}
            className="flex-1"
            size="lg"
          >
            Continuar →
          </Button>
        </div>
      </div>
    </div>
  );
};
