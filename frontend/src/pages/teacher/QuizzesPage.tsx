import { useEffect, useState } from 'react';
import { Search, Plus, Edit, Trash2, Play, Copy, MoreVertical, Grid3x3, List } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { quizzesApi, Quiz } from '@/lib/api/quizzes';
import { catalogApi } from '@/lib/api/catalog';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function QuizzesPage() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    estado: '',
    materia_id: '',
    grado_id: '',
  });

  const [, setGrados] = useState<any[]>([]);
  const [materias, setMaterias] = useState<any[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadCatalogs();
  }, []);

  useEffect(() => {
    loadQuizzes();
  }, [filters, search]);

  const loadCatalogs = async () => {
    try {
      const [gradosRes, materiasRes] = await Promise.all([
        catalogApi.getGrados(),
        catalogApi.getMaterias(),
      ]);
      setGrados(gradosRes.data);
      setMaterias(materiasRes.data);
    } catch (error) {
      console.error('Error loading catalogs:', error);
    }
  };

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const response = await quizzesApi.getQuizzes({
        search: search || undefined,
        estado: filters.estado as any || undefined,
        grado_id: filters.grado_id || undefined,
        materia_id: filters.materia_id || undefined,
      });
      setQuizzes(response.data.data.quizzes || []);
    } catch (error: any) {
      console.error('Error loading quizzes:', error);
      toast.error('Error al cargar los quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!quizToDelete) return;

    try {
      await quizzesApi.deleteQuiz(quizToDelete);
      toast.success('Quiz archivado');
      setShowDeleteModal(false);
      setQuizToDelete(null);
      loadQuizzes();
    } catch (error) {
      toast.error('Error al archivar quiz');
    }
  };

  const openDeleteModal = (quizId: string) => {
    setQuizToDelete(quizId);
    setShowDeleteModal(true);
  };

  const handlePublish = async (quizId: string) => {
    try {
      await quizzesApi.publishQuiz(quizId);
      toast.success('Quiz publicado exitosamente');
      loadQuizzes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al publicar quiz');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, any> = {
      borrador: { variant: 'secondary', text: '📝 Borrador' },
      publicado: { variant: 'default', text: '✅ Publicado' },
      archivado: { variant: 'destructive', text: '🗄️ Archivado' },
    };
    const config = variants[estado] || variants.borrador;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Quizzes</h1>
          <p className="text-gray-600 mt-1">Crea y gestiona tus quizzes educativos</p>
        </div>
        <Button onClick={() => navigate('/teacher/quizzes/create')} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Crear Quiz
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar quizzes por título..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select
              value={filters.estado || 'all'}
              onValueChange={(value) => setFilters({ ...filters, estado: value === 'all' ? '' : value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="borrador">📝 Borrador</SelectItem>
                <SelectItem value="publicado">✅ Publicado</SelectItem>
                <SelectItem value="archivado">🗄️ Archivado</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.materia_id || 'all'}
              onValueChange={(value) => setFilters({ ...filters, materia_id: value === 'all' ? '' : value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todas las materias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las materias</SelectItem>
                {materias?.map((materia) => (
                  <SelectItem key={materia.id} value={materia.id}>
                    {materia.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quizzes List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-6xl animate-bounce mb-4">🎯</div>
            <p className="text-gray-600">Cargando quizzes...</p>
          </div>
        </div>
      ) : quizzes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No tienes quizzes aún
            </h3>
            <p className="text-gray-600 mb-6">
              Crea tu primer quiz para empezar a evaluar a tus estudiantes
            </p>
            <Button onClick={() => navigate('/teacher/quizzes/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Mi Primer Quiz
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                {quiz.imagen_portada && (
                  <img
                    src={quiz.imagen_portada}
                    alt={quiz.titulo}
                    className="w-full h-32 object-cover rounded-t-lg mb-4"
                  />
                )}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getEstadoBadge(quiz.estado)}
                      <Badge variant="outline" className="text-xs">
                        {quiz.tipo_quiz}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-lg line-clamp-2">
                      {quiz.titulo}
                    </h3>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {quiz.estado === 'publicado' && (
                        <>
                          <DropdownMenuItem onClick={() => navigate('/teacher/rooms/create', { state: { selectedQuizId: quiz.id } })}>
                            <Play className="h-4 w-4 mr-2 text-green-600" />
                            Jugar Ahora
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem onClick={() => navigate(`/teacher/quizzes/${quiz.id}/edit`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      {quiz.estado === 'borrador' && (
                        <DropdownMenuItem onClick={() => handlePublish(quiz.id)}>
                          <Play className="h-4 w-4 mr-2" />
                          Publicar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => openDeleteModal(quiz.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Archivar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {quiz.descripcion || 'Sin descripción'}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{quiz.num_preguntas || 0} preguntas</span>
                  <span>{quiz.materias?.nombre}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 mt-2 mb-4">
                  <span>🎮 {quiz.veces_jugado} veces jugado</span>
                  {quiz.dificultad && (
                    <span>
                      {quiz.dificultad === 'facil' && '😊'}
                      {quiz.dificultad === 'medio' && '🤔'}
                      {quiz.dificultad === 'dificil' && '🔥'}
                      {' '}{quiz.dificultad}
                    </span>
                  )}
                </div>
                {quiz.estado === 'publicado' && (
                  <Button 
                    onClick={() => navigate('/teacher/rooms/create', { state: { selectedQuizId: quiz.id } })}
                    className="w-full"
                    variant="default"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Jugar Ahora
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz) => (
            <Card key={quiz.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      {getEstadoBadge(quiz.estado)}
                      <h3 className="font-semibold">{quiz.titulo}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{quiz.num_preguntas || 0} preguntas</span>
                      <span>{quiz.materias?.nombre}</span>
                      <span>{quiz.grados?.nombre}</span>
                      <span>🎮 {quiz.veces_jugado} jugado</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/teacher/quizzes/${quiz.id}/edit`)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    {quiz.estado === 'borrador' && (
                      <Button
                        size="sm"
                        onClick={() => handlePublish(quiz.id)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Publicar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Quiz Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Archivar quiz?</DialogTitle>
            <DialogDescription>
              El quiz será archivado y ya no aparecerá en la lista principal. Podrás restaurarlo más tarde desde quizzes archivados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Archivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
