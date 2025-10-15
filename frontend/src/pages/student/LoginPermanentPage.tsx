import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { studentAuthApi } from '@/lib/api/studentAuth';
import { toast } from 'sonner';

const loginSchema = z.object({
  username: z.string().min(1, 'Usuario es requerido'),
  password: z.string().min(1, 'Contraseña es requerida'),
  remember: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginPermanentPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);

    try {
      console.log('Intentando login con:', data.username);
      
      const result = await studentAuthApi.loginPermanent({
        username: data.username,
        password: data.password,
      });

      console.log('Respuesta del servidor:', result);

      if (result.success) {
        // Guardar token
        localStorage.setItem('auth_token', result.data.accessToken);
        localStorage.setItem('refresh_token', result.data.refreshToken);
        localStorage.setItem('session_type', result.data.session_type);
        localStorage.setItem('user', JSON.stringify(result.data.user));

        if (data.remember) {
          localStorage.setItem('remember_username', data.username);
        }

        toast.success(`¡Bienvenido de nuevo, ${result.data.user.nombre}! 🎉`);
        
        // Redirigir al dashboard del estudiante
        setTimeout(() => {
          navigate('/dashboard/student');
        }, 500);
      }
    } catch (error: any) {
      console.error('Error en login:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Usuario o contraseña incorrectos';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">👤</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Iniciar Sesión
          </h1>
          <p className="text-gray-600">
            Ingresa con tu usuario y contraseña
          </p>
        </div>

        <form 
          onSubmit={(e) => {
            console.log('Form submit event triggered');
            console.log('Valores del formulario:', watch());
            handleSubmit(onSubmit)(e);
          }} 
          className="space-y-4"
        >
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Usuario
            </label>
            <Input
              {...register('username')}
              type="text"
              placeholder="juan.perez"
              className="text-lg"
              autoFocus
            />
            {errors.username && (
              <p className="text-sm text-red-600 mt-1">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Contraseña
            </label>
            <div className="relative">
              <Input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Tu contraseña"
                className="text-lg pr-10"
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
              <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="remember" 
              {...register('remember')}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="remember"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Recordarme
            </label>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading}
            onClick={() => {
              console.log('Botón clickeado');
              console.log('Errores de validación:', JSON.stringify(errors, null, 2));
              console.log('isLoading:', isLoading);
            }}
          >
            {isLoading ? 'Ingresando...' : 'Entrar 🎮'}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              ¿Primera vez?{' '}
              <Link
                to="/student/register-permanent"
                className="text-blue-600 hover:underline font-medium"
              >
                Regístrate aquí
              </Link>
            </p>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/student/join')}
              className="w-full"
            >
              ← Ver otras opciones
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
