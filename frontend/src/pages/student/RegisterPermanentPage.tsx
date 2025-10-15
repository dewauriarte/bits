import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { studentAuthApi } from '@/lib/api/studentAuth';
import { toast } from 'sonner';

const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Usuario debe tener al menos 3 caracteres')
    .regex(/^[a-z]+\.[a-z]+$/, 'Formato debe ser: nombre.apellido (minúsculas)'),
  password: z.string().min(4, 'Contraseña debe tener al menos 4 caracteres'),
  confirmPassword: z.string(),
  nombre: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'Apellido debe tener al menos 2 caracteres'),
  age: z.number().int().min(5).max(18),
  grade_id: z.number().int().min(1).max(14),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export const RegisterPermanentPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const nombre = watch('nombre') || '';
  const apellido = watch('apellido') || '';

  // Auto-generar username
  const generateUsername = () => {
    if (nombre && apellido) {
      const username = `${nombre.toLowerCase()}.${apellido.toLowerCase()}`;
      setValue('username', username);
    }
  };

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);

    try {
      const result = await studentAuthApi.registerPermanent({
        username: data.username,
        password: data.password,
        nombre: data.nombre,
        apellido: data.apellido,
        age: data.age,
        grade_id: data.grade_id,
      });

      if (result.success) {
        // Guardar token
        localStorage.setItem('auth_token', result.data.accessToken);
        localStorage.setItem('refresh_token', result.data.refreshToken);
        localStorage.setItem('session_type', result.data.session_type);
        localStorage.setItem('user', JSON.stringify(result.data.user));

        toast.success('¡Cuenta creada exitosamente! 🎉');
        
        // Redirigir al dashboard
        navigate('/dashboard/student');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">✨</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Crear Cuenta
          </h1>
          <p className="text-gray-600">
            ¡Guarda tu progreso para siempre!
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Nombre
              </label>
              <Input
                {...register('nombre')}
                type="text"
                placeholder="Juan"
                onBlur={generateUsername}
                autoFocus
              />
              {errors.nombre && (
                <p className="text-xs text-red-600 mt-1">{errors.nombre.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Apellido
              </label>
              <Input
                {...register('apellido')}
                type="text"
                placeholder="Pérez"
                onBlur={generateUsername}
              />
              {errors.apellido && (
                <p className="text-xs text-red-600 mt-1">{errors.apellido.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Usuario
            </label>
            <div className="flex gap-2">
              <Input
                {...register('username')}
                type="text"
                placeholder="juan.perez"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={generateUsername}
                size="sm"
              >
                🔄
              </Button>
            </div>
            {errors.username && (
              <p className="text-xs text-red-600 mt-1">{errors.username.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Formato: nombre.apellido (sin espacios, minúsculas)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Edad
              </label>
              <Input
                {...register('age', { valueAsNumber: true })}
                type="number"
                min={5}
                max={18}
                placeholder="10"
              />
              {errors.age && (
                <p className="text-xs text-red-600 mt-1">{errors.age.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Grado
              </label>
              <Select onValueChange={(value) => setValue('grade_id', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">1° Primaria</SelectItem>
                  <SelectItem value="5">2° Primaria</SelectItem>
                  <SelectItem value="6">3° Primaria</SelectItem>
                  <SelectItem value="7">4° Primaria</SelectItem>
                  <SelectItem value="8">5° Primaria</SelectItem>
                  <SelectItem value="9">6° Primaria</SelectItem>
                </SelectContent>
              </Select>
              {errors.grade_id && (
                <p className="text-xs text-red-600 mt-1">{errors.grade_id.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Contraseña
            </label>
            <div className="relative">
              <Input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 4 caracteres"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <Input
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Escribe de nuevo"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-600 mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-xs text-green-800">
              ✅ <strong>No necesitas email</strong>
              <br />
              📊 Guarda tu progreso y estadísticas
              <br />
              🏆 Desbloquea logros y trofeos
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? 'Creando cuenta...' : 'Crear Cuenta 🎉'}
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link
                to="/student/login-permanent"
                className="text-blue-600 hover:underline font-medium"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
};
