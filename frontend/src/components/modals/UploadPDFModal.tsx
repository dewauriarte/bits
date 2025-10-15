import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { aiApi } from '@/lib/api/quizzes';
import { useNavigate } from 'react-router-dom';

interface UploadPDFModalProps {
  open: boolean;
  onClose: () => void;
  grados: { id: string; nombre: string }[];
  materias: { id: string; nombre: string }[];
}

export default function UploadPDFModal({ open, onClose, grados = [], materias = [] }: UploadPDFModalProps) {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const [formData, setFormData] = useState({
    num_questions: 10,
    grado_id: '',
    materia_id: '',
    dificultad: 'medio' as 'facil' | 'medio' | 'dificil',
    tipo_quiz: 'kahoot' as 'kahoot' | 'mario_party' | 'duelo',
    tiempo_por_pregunta: 20,
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
      } else {
        toast.error('Solo se permiten archivos PDF');
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
      } else {
        toast.error('Solo se permiten archivos PDF');
      }
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Por favor selecciona un archivo PDF');
      return;
    }

    if (!formData.grado_id || !formData.materia_id) {
      toast.error('Por favor selecciona grado y materia');
      return;
    }

    try {
      setUploading(true);
      setProgress(0);

      const data = new FormData();
      data.append('pdf', file);
      data.append('num_questions', formData.num_questions.toString());
      data.append('grado_id', formData.grado_id);
      data.append('materia_id', formData.materia_id);
      data.append('dificultad', formData.dificultad);
      data.append('tipo_quiz', formData.tipo_quiz);
      data.append('tiempo_por_pregunta', formData.tiempo_por_pregunta.toString());

      // Simular progreso
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      console.log('Sending PDF form data:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        num_questions: formData.num_questions,
        grado_id: formData.grado_id,
        materia_id: formData.materia_id,
        dificultad: formData.dificultad,
        tipo_quiz: formData.tipo_quiz,
        tiempo_por_pregunta: formData.tiempo_por_pregunta,
      });

      const response = await aiApi.generateFromPDF(data);
      
      clearInterval(progressInterval);
      setProgress(100);

      toast.success('¡Quiz generado exitosamente!');
      
      // Redirigir al editor
      setTimeout(() => {
        navigate(`/teacher/quizzes/${response.data.data.quiz_id}/edit`);
        onClose();
      }, 500);
    } catch (error: any) {
      console.error('Error uploading PDF:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMsg = error.response?.data?.message || 'Error al generar quiz desde PDF';
      const errors = error.response?.data?.errors;
      
      if (errors && errors.length > 0) {
        console.error('Validation errors:', errors);
        toast.error(`${errorMsg}: ${errors.map((e: any) => `${e.path} - ${e.message}`).join(', ')}`);
      } else {
        toast.error(errorMsg);
      }
      
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generar Quiz desde PDF</DialogTitle>
          <DialogDescription>
            Sube un documento PDF y la IA generará preguntas basadas en su contenido
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Drag & Drop Zone */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-indigo-500 bg-indigo-50'
                : file
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />

            {file ? (
              <div className="flex items-center justify-center gap-4">
                <FileText className="h-12 w-12 text-green-600" />
                <div className="text-left">
                  <p className="font-semibold text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div>
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">
                  Arrastra tu PDF aquí o <span className="text-indigo-600 font-semibold">haz clic para seleccionar</span>
                </p>
                <p className="text-sm text-gray-500">Tamaño máximo: 10 MB</p>
              </div>
            )}
          </div>

          {/* Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="num_questions">Número de preguntas</Label>
              <Input
                id="num_questions"
                type="number"
                min={5}
                max={50}
                value={formData.num_questions}
                onChange={(e) => setFormData({ ...formData, num_questions: parseInt(e.target.value) })}
                disabled={uploading}
              />
            </div>

            <div>
              <Label htmlFor="dificultad">Dificultad</Label>
              <Select
                value={formData.dificultad}
                onValueChange={(value: any) => setFormData({ ...formData, dificultad: value })}
                disabled={uploading}
              >
                <SelectTrigger id="dificultad">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facil">😊 Fácil</SelectItem>
                  <SelectItem value="medio">🤔 Medio</SelectItem>
                  <SelectItem value="dificil">🔥 Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="grado">Grado</Label>
              <Select
                value={formData.grado_id}
                onValueChange={(value) => setFormData({ ...formData, grado_id: value })}
                disabled={uploading}
              >
                <SelectTrigger id="grado">
                  <SelectValue placeholder="Selecciona grado" />
                </SelectTrigger>
                <SelectContent>
                  {grados?.map((grado) => (
                    <SelectItem key={grado.id} value={grado.id}>
                      {grado.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="materia">Materia</Label>
              <Select
                value={formData.materia_id}
                onValueChange={(value) => setFormData({ ...formData, materia_id: value })}
                disabled={uploading}
              >
                <SelectTrigger id="materia">
                  <SelectValue placeholder="Selecciona materia" />
                </SelectTrigger>
                <SelectContent>
                  {materias?.map((materia) => (
                    <SelectItem key={materia.id} value={materia.id}>
                      {materia.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-center text-gray-600">
                {progress < 100 ? 'Generando quiz...' : '¡Completado!'}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={uploading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!file || uploading}>
              {uploading ? 'Generando...' : 'Generar Quiz'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
