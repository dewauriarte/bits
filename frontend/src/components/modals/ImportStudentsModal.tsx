import { useState } from 'react';
import { Upload, Download, CheckCircle, AlertCircle, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { classesApi } from '@/lib/api/classes';
import { toast } from 'sonner';

interface ImportStudentsModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classId: string;
  className: string;
}

export default function ImportStudentsModal({
  open,
  onClose,
  onSuccess,
  classId,
  className,
}: ImportStudentsModalProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleDownloadTemplate = () => {
    const templateUrl = classesApi.downloadTemplate();
    window.open(templateUrl, '_blank');
    toast.success('Descargando plantilla...');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validar que sea CSV o Excel
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];
      
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
        toast.error('Por favor selecciona un archivo CSV o Excel (.xlsx)');
        return;
      }

      setFile(selectedFile);
      setResult(null);
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('El archivo está vacío o no tiene datos');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const students = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const student: any = {};

      headers.forEach((header, index) => {
        student[header] = values[index] || '';
      });

      // Solo agregar si tiene al menos username
      if (student.username) {
        students.push(student);
      }
    }

    return students;
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Por favor selecciona un archivo');
      return;
    }

    try {
      setLoading(true);
      
      // Leer archivo
      const text = await file.text();
      const students = parseCSV(text);

      if (students.length === 0) {
        toast.error('No se encontraron estudiantes en el archivo');
        return;
      }

      // Enviar al backend
      const response = await classesApi.importStudents(classId, students);
      
      setResult(response.data);
      toast.success(response.message || 'Estudiantes importados exitosamente');
      
      // Esperar 2 segundos para mostrar resultados antes de cerrar
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error: any) {
      console.error('Error importing students:', error);
      toast.error(error.response?.data?.message || 'Error al importar estudiantes');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFile(null);
      setResult(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Importar Estudiantes</DialogTitle>
          <DialogDescription>
            Importa una lista de estudiantes a la clase <strong>{className}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instrucciones */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">📋 Instrucciones:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Descarga la plantilla CSV haciendo click en el botón de abajo</li>
              <li>Completa los datos de tus estudiantes en el archivo</li>
              <li>Guarda el archivo y súbelo aquí</li>
              <li>Los estudiantes nuevos recibirán la contraseña: <strong>1234</strong></li>
              <li>Los estudiantes existentes mantendrán su contraseña actual</li>
            </ol>
          </div>

          {/* Descargar plantilla */}
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadTemplate}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar Plantilla CSV
            </Button>
          </div>

          {/* Formato esperado */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">📝 Formato del archivo:</h4>
            <div className="bg-white p-3 rounded border font-mono text-xs overflow-x-auto">
              <div className="text-gray-600">username,nombre,apellido</div>
              <div className="text-gray-900">estudiante1,Juan,Pérez</div>
              <div className="text-gray-900">estudiante2,María,García</div>
              <div className="text-gray-900">estudiante3,Carlos,López</div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              * Todos los campos son <strong>obligatorios</strong>
            </p>
          </div>

          {/* Subir archivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecciona tu archivo CSV o Excel
            </label>
            <div className="flex items-center gap-3">
              <label
                htmlFor="file-upload"
                className="flex-1 cursor-pointer flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 transition-colors"
              >
                <Upload className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">
                  {file ? file.name : 'Haz click para seleccionar archivo'}
                </span>
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={loading}
                />
              </label>
              {file && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                  disabled={loading}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Resultados */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900 mb-2">
                    ✅ Importación Exitosa
                  </h4>
                  <div className="space-y-1 text-sm text-green-800">
                    <p>• Total procesados: <strong>{result.total}</strong></p>
                    <p>• Nuevos estudiantes: <strong>{result.nuevos}</strong></p>
                    <p>• Estudiantes existentes: <strong>{result.existentes}</strong></p>
                  </div>
                  
                  {result.nuevos > 0 && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-xs text-yellow-800">
                        <strong>⚠️ Importante:</strong> Los nuevos estudiantes pueden iniciar sesión con:
                      </p>
                      <p className="text-xs text-yellow-800 font-mono mt-1">
                        Contraseña: <strong>1234</strong>
                      </p>
                    </div>
                  )}

                  {result.errores && result.errores.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-red-600">Errores:</p>
                      <ul className="text-xs text-red-600 list-disc list-inside">
                        {result.errores.slice(0, 5).map((error: string, i: number) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              {result ? 'Cerrar' : 'Cancelar'}
            </Button>
            <Button
              type="button"
              onClick={handleImport}
              disabled={loading || !file || !!result}
              className="flex-1"
            >
              {loading ? 'Importando...' : 'Importar Estudiantes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
