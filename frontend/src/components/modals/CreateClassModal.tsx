import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { classesApi } from '@/lib/api/classes';
import { catalogApi, Grado, Materia } from '@/lib/api/catalog';
import { toast } from 'sonner';

const createClassSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(100),
  descripcion: z.string().max(500).optional(),
  grado_id: z.string().min(1, 'Selecciona un grado'),
  materia_id: z.string().min(1, 'Selecciona una materia'),
  anio_escolar: z.string().regex(/^\d{4}$/, 'Formato: YYYY'),
});

type CreateClassForm = z.infer<typeof createClassSchema>;

interface CreateClassModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateClassModal({ open, onClose, onSuccess }: CreateClassModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedGrado, setSelectedGrado] = useState('');
  const [selectedMateria, setSelectedMateria] = useState('');
  const [grados, setGrados] = useState<Grado[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateClassForm>({
    resolver: zodResolver(createClassSchema),
    defaultValues: {
      anio_escolar: new Date().getFullYear().toString(),
    },
  });

  // Cargar catálogos al abrir el modal
  useEffect(() => {
    if (open) {
      loadCatalogs();
    }
  }, [open]);

  const loadCatalogs = async () => {
    try {
      setLoadingCatalogs(true);
      const [gradosRes, materiasRes] = await Promise.all([
        catalogApi.getGrados(),
        catalogApi.getMaterias(),
      ]);
      setGrados(gradosRes.data || []);
      setMaterias(materiasRes.data || []);
    } catch (error) {
      console.error('Error loading catalogs:', error);
      toast.error('Error al cargar grados y materias');
    } finally {
      setLoadingCatalogs(false);
    }
  };

  const onSubmit = async (data: CreateClassForm) => {
    try {
      setLoading(true);
      await classesApi.createClass(data);
      toast.success('¡Clase creada exitosamente! 🎉');
      reset();
      setSelectedGrado('');
      setSelectedMateria('');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating class:', error);
      toast.error(error.response?.data?.message || 'Error al crear la clase');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      reset();
      setSelectedGrado('');
      setSelectedMateria('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Crear Nueva Clase</DialogTitle>
          <DialogDescription>
            Completa los datos para crear tu clase. El código se generará automáticamente.
          </DialogDescription>
        </DialogHeader>


        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nombre */}
          <div>
            <Label htmlFor="nombre">
              Nombre de la clase <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nombre"
              {...register('nombre')}
              placeholder="Ej: Matemáticas 3°A"
              disabled={loading}
            />
            {errors.nombre && (
              <p className="text-sm text-red-600 mt-1">{errors.nombre.message}</p>
            )}
          </div>

          {/* Grado */}
          <div>
            <Label htmlFor="grado_id">
              Grado <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedGrado}
              onValueChange={(value) => {
                setSelectedGrado(value);
                setValue('grado_id', value);
              }}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un grado" />
              </SelectTrigger>
              <SelectContent>
                {loadingCatalogs ? (
                  <div className="p-2 text-sm text-gray-500">Cargando...</div>
                ) : (
                  grados.map((grado) => (
                    <SelectItem key={grado.id} value={grado.id}>
                      {grado.nombre}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.grado_id && (
              <p className="text-sm text-red-600 mt-1">{errors.grado_id.message}</p>
            )}
          </div>

          {/* Materia */}
          <div>
            <Label htmlFor="materia_id">
              Materia <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedMateria}
              onValueChange={(value) => {
                setSelectedMateria(value);
                setValue('materia_id', value);
              }}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una materia" />
              </SelectTrigger>
              <SelectContent>
                {loadingCatalogs ? (
                  <div className="p-2 text-sm text-gray-500">Cargando...</div>
                ) : (
                  materias.map((materia) => (
                    <SelectItem key={materia.id} value={materia.id}>
                      {materia.icono && <span className="mr-2">{materia.icono}</span>}
                      {materia.nombre}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.materia_id && (
              <p className="text-sm text-red-600 mt-1">{errors.materia_id.message}</p>
            )}
          </div>

          {/* Año Escolar */}
          <div>
            <Label htmlFor="anio_escolar">
              Año Escolar <span className="text-red-500">*</span>
            </Label>
            <Input
              id="anio_escolar"
              {...register('anio_escolar')}
              placeholder="2025"
              disabled={loading}
            />
            {errors.anio_escolar && (
              <p className="text-sm text-red-600 mt-1">{errors.anio_escolar.message}</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <Label htmlFor="descripcion">Descripción (opcional)</Label>
            <Textarea
              id="descripcion"
              {...register('descripcion')}
              placeholder="Describe tu clase..."
              rows={3}
              disabled={loading}
            />
            {errors.descripcion && (
              <p className="text-sm text-red-600 mt-1">{errors.descripcion.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creando...' : 'Crear Clase'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
