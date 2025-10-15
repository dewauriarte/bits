import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { UserPlus, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import {
  registerProfesorSchema,
  type RegisterProfesorFormData,
} from '@/schemas/auth.schema';

const MATERIAS = [
  { id: 1, nombre: 'Matemáticas' },
  { id: 2, nombre: 'Física' },
  { id: 3, nombre: 'Química' },
  { id: 4, nombre: 'Biología' },
  { id: 5, nombre: 'Lenguaje' },
  { id: 6, nombre: 'Historia' },
  { id: 7, nombre: 'Inglés' },
  { id: 8, nombre: 'Computación' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser, isLoading, error } = useAuthStore();
  const [selectedMaterias, setSelectedMaterias] = useState<number[]>([]);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Form para Profesor
  const profesorForm = useForm<RegisterProfesorFormData>({
    resolver: zodResolver(registerProfesorSchema),
    defaultValues: {
      rol: 'profesor',
      materias: [],
    },
  });

  const onSubmitProfesor = async (data: RegisterProfesorFormData) => {
    try {
      await registerUser({
        username: data.username,
        email: data.email,
        password: data.password,
        nombre: data.nombre,
        apellido: data.apellido,
        rol: 'profesor',
        fechaNacimiento: data.fechaNacimiento,
      });
      toast.success('¡Cuenta creada exitosamente! Bienvenido 🎉');
      navigate('/dashboard');
    } catch (err) {
      // Error manejado por el store
    }
  };

  const toggleMateria = (materiaId: number) => {
    const newMaterias = selectedMaterias.includes(materiaId)
      ? selectedMaterias.filter((id) => id !== materiaId)
      : [...selectedMaterias, materiaId];
    
    setSelectedMaterias(newMaterias);
    profesorForm.setValue('materias', newMaterias);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center"
            >
              <UserPlus className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Crear Cuenta
            </CardTitle>
            <CardDescription className="text-base">
              Únete a nuestra plataforma educativa
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Mensaje para estudiantes */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>¿Eres estudiante?</strong> Tienes opciones de registro sin email. {' '}
                <Link to="/student/join" className="font-semibold hover:underline">
                  Ir a registro de estudiantes →
                </Link>
              </p>
            </div>

            {/* Formulario solo para profesores */}
            <form onSubmit={profesorForm.handleSubmit(onSubmitProfesor)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre-prof">Nombre</Label>
                      <Input
                        id="nombre-prof"
                        {...profesorForm.register('nombre')}
                        className={profesorForm.formState.errors.nombre ? 'border-red-500' : ''}
                        disabled={isLoading}
                      />
                      {profesorForm.formState.errors.nombre && (
                        <p className="text-sm text-red-500">{profesorForm.formState.errors.nombre.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="apellido-prof">Apellido</Label>
                      <Input
                        id="apellido-prof"
                        {...profesorForm.register('apellido')}
                        className={profesorForm.formState.errors.apellido ? 'border-red-500' : ''}
                        disabled={isLoading}
                      />
                      {profesorForm.formState.errors.apellido && (
                        <p className="text-sm text-red-500">{profesorForm.formState.errors.apellido.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username-prof">Username</Label>
                    <Input
                      id="username-prof"
                      {...profesorForm.register('username')}
                      className={profesorForm.formState.errors.username ? 'border-red-500' : ''}
                      disabled={isLoading}
                    />
                    {profesorForm.formState.errors.username && (
                      <p className="text-sm text-red-500">{profesorForm.formState.errors.username.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email-prof">Email</Label>
                    <Input
                      id="email-prof"
                      type="email"
                      {...profesorForm.register('email')}
                      className={profesorForm.formState.errors.email ? 'border-red-500' : ''}
                      disabled={isLoading}
                    />
                    {profesorForm.formState.errors.email && (
                      <p className="text-sm text-red-500">{profesorForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Materias que impartes (selecciona hasta 5)</Label>
                    <div className="grid grid-cols-2 gap-2 p-4 border rounded-lg">
                      {MATERIAS.map((materia) => (
                        <div key={materia.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`materia-${materia.id}`}
                            checked={selectedMaterias.includes(materia.id)}
                            onCheckedChange={() => toggleMateria(materia.id)}
                            disabled={isLoading || (selectedMaterias.length >= 5 && !selectedMaterias.includes(materia.id))}
                          />
                          <label htmlFor={`materia-${materia.id}`} className="text-sm cursor-pointer">
                            {materia.nombre}
                          </label>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">Seleccionadas: {selectedMaterias.length}/5</p>
                    {profesorForm.formState.errors.materias && (
                      <p className="text-sm text-red-500">{profesorForm.formState.errors.materias.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password-prof">Contraseña</Label>
                      <Input
                        id="password-prof"
                        type="password"
                        {...profesorForm.register('password')}
                        className={profesorForm.formState.errors.password ? 'border-red-500' : ''}
                        disabled={isLoading}
                      />
                      {profesorForm.formState.errors.password && (
                        <p className="text-sm text-red-500">{profesorForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-prof">Confirmar</Label>
                      <Input
                        id="confirm-prof"
                        type="password"
                        {...profesorForm.register('confirmPassword')}
                        className={profesorForm.formState.errors.confirmPassword ? 'border-red-500' : ''}
                        disabled={isLoading}
                      />
                      {profesorForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-red-500">{profesorForm.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms-prof"
                      checked={acceptTerms}
                      onCheckedChange={(checked) => {
                        setAcceptTerms(checked as boolean);
                        profesorForm.setValue('acceptTerms', checked as boolean);
                      }}
                      disabled={isLoading}
                    />
                    <label htmlFor="terms-prof" className="text-sm cursor-pointer">
                      Acepto los{' '}
                      <Link to="/terms" className="text-indigo-600 hover:underline">
                        Términos y Condiciones
                      </Link>
                    </label>
                  </div>
                  {profesorForm.formState.errors.acceptTerms && (
                    <p className="text-sm text-red-500">{profesorForm.formState.errors.acceptTerms.message}</p>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando cuenta...
                      </>
                    ) : (
                      'Crear Cuenta'
                    )}
                  </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" className="text-indigo-600 hover:underline font-medium">
                  Inicia Sesión
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
