import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Star, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Board } from '@/types/mario-party.types';
import { getAuthHeaders } from '@/lib/auth-helpers';

interface BoardSelectorProps {
  onSelectBoard: (boardId: string) => void;
  onCancel: () => void;
}

export default function BoardSelector({ onSelectBoard, onCancel }: BoardSelectorProps) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      const response = await fetch('/api/boards', {
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Error al cargar tableros');

      const data = await response.json();
      setBoards(data.data);
    } catch (error) {
      console.error('Error loading boards:', error);
      toast.error('Error al cargar los tableros');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedBoard) {
      onSelectBoard(selectedBoard);
    }
  };

  const getThemeEmoji = (tema: string) => {
    const emojis: Record<string, string> = {
      jungle: '🌴',
      space: '🚀',
      underwater: '🐠',
      castle: '🏰',
      desert: '🏜️'
    };
    return emojis[tema] || '🎮';
  };

  const getThemeGradient = (tema: string) => {
    const gradients: Record<string, string> = {
      jungle: 'from-green-400 to-emerald-600',
      space: 'from-purple-400 to-indigo-600',
      underwater: 'from-blue-400 to-cyan-600',
      castle: 'from-pink-400 to-purple-600',
      desert: 'from-yellow-400 to-orange-600'
    };
    return gradients[tema] || 'from-gray-400 to-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600">Cargando tableros...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🎲 Selecciona un Tablero
        </h2>
        <p className="text-gray-600">
          Elige el escenario para tu aventura Mario Party
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {boards.map((board, index) => (
          <motion.div
            key={board.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className={`cursor-pointer transition-all duration-300 overflow-hidden ${
                selectedBoard === board.id 
                  ? 'ring-4 ring-purple-500 scale-105' 
                  : 'hover:shadow-xl hover:scale-102'
              }`}
              onClick={() => setSelectedBoard(board.id)}
            >
              {/* Header con gradiente temático */}
              <div className={`h-32 bg-gradient-to-br ${getThemeGradient(board.tema)} relative`}>
                {/* Emoji grande del tema */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-6xl opacity-50">
                    {getThemeEmoji(board.tema)}
                  </span>
                </div>
                
                {/* Badge de seleccionado */}
                {selectedBoard === board.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2"
                  >
                    <Badge className="bg-white text-purple-600">
                      ✓ Seleccionado
                    </Badge>
                  </motion.div>
                )}
              </div>

              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{getThemeEmoji(board.tema)}</span>
                  <span>{board.nombre}</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Información del tablero */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{board.total_casillas} casillas</span>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-600">
                    <Star className="w-4 h-4" />
                    <span>{board.posiciones_estrellas?.length || 2} estrellas</span>
                  </div>
                </div>

                {/* Distribución de casillas */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-700">
                    Tipos de casillas:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">
                      ❓ Preguntas
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      ⭐ Estrellas
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      🎁 Eventos
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      💀 Trampas
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      ⚔️ Duelos
                    </Badge>
                  </div>
                </div>

                {/* Recomendación de jugadores */}
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Users className="w-3 h-3" />
                  <span>Recomendado: 2-6 jugadores</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Botones de acción */}
      <div className="flex gap-4 justify-center">
        <Button
          variant="outline"
          onClick={onCancel}
          className="px-8"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!selectedBoard}
          className="px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          Confirmar Tablero
        </Button>
      </div>
    </div>
  );
}
