import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from '@/layouts/PublicLayout';
import { TeacherLayout } from '@/layouts/TeacherLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleRoute from '@/components/RoleRoute';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';

// Student Login Pages (Sin Email)
import { StudentJoinPage } from '@/pages/student/StudentJoinPage';
import { JoinByCodePage } from '@/pages/student/JoinByCodePage';
import { JoinByQRPage } from '@/pages/student/JoinByQRPage';
import { LoginPermanentPage } from '@/pages/student/LoginPermanentPage';
import { RegisterPermanentPage } from '@/pages/student/RegisterPermanentPage';
import { AvatarLoginPage } from '@/pages/student/AvatarLoginPage';
import { SelectClassPage } from '@/pages/student/SelectClassPage';
import { StudentDashboard } from '@/pages/student/StudentDashboard';
import StudentClassesPage from '@/pages/student/StudentClassesPage';
import { JoinCustomizePage } from '@/pages/student/JoinCustomizePage';
import { JoinByLinkPage } from '@/pages/student/JoinByLinkPage';
import { SelectStudentPage } from '@/pages/student/SelectStudentPage';
import ClassesPage from '@/pages/teacher/ClassesPage';
import ClassDetailPage from '@/pages/teacher/ClassDetailPage';
import EditClassPage from '@/pages/teacher/EditClassPage';
import AIConfigPage from '@/pages/teacher/AIConfigPage';
import QuizzesPage from '@/pages/teacher/QuizzesPage';
import CreateQuizPage from '@/pages/teacher/CreateQuizPage';
import EditQuizPage from '@/pages/teacher/EditQuizPage';
import CreateRoomPage from '@/pages/teacher/CreateRoomPage';
import TeacherLobbyPage from '@/pages/teacher/TeacherLobbyPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Route>

          {/* Student Login Routes (Sin Email) - Public */}
          <Route path="/student/join" element={<StudentJoinPage />} />
          <Route path="/student/join/code" element={<JoinByCodePage />} />
          <Route path="/student/join/qr" element={<JoinByQRPage />} />
          <Route path="/join/:code" element={<JoinByLinkPage />} />
          <Route path="/join/:code/customize" element={<JoinCustomizePage />} />
          <Route path="/join/:code/select-student" element={<SelectStudentPage />} />
          <Route path="/student/login-permanent" element={<LoginPermanentPage />} />
          <Route path="/student/register-permanent" element={<RegisterPermanentPage />} />
          <Route path="/student/avatars" element={<SelectClassPage />} />
          <Route path="/student/avatars/:class_id" element={<AvatarLoginPage />} />
          
          {/* Game Routes - Public for students */}
          <Route path="/game/:code/lobby" element={<TeacherLobbyPage />} />

          {/* Teacher/Admin Dashboard with Sidebar */}
          <Route element={<TeacherLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/teacher/quizzes" element={<QuizzesPage />} />
            <Route path="/teacher/quizzes/create" element={<CreateQuizPage />} />
            <Route path="/teacher/quizzes/:id/edit" element={<EditQuizPage />} />
            <Route path="/teacher/rooms/create" element={<CreateRoomPage />} />
            <Route path="/teacher/rooms/:code/lobby" element={<TeacherLobbyPage />} />
            <Route path="/clases" element={<ClassesPage />} />
            <Route path="/clases/:id/editar" element={<EditClassPage />} />
            <Route path="/clases/:id" element={<ClassDetailPage />} />
            <Route path="/resultados" element={<div className="p-8">Resultados (Próximamente)</div>} />
            <Route path="/configuracion" element={<AIConfigPage />} />
          </Route>

          {/* Student Dashboard - Sin protección estricta por ahora */}
          <Route path="/dashboard/student" element={<StudentDashboard />} />
          <Route path="/student/classes" element={<StudentClassesPage />} />

          {/* Admin Only Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['admin']}>
                  <div className="p-8 text-center">
                    <h1 className="text-3xl font-bold">Admin Panel</h1>
                    <p className="text-gray-600 mt-2">Sección de administración</p>
                  </div>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Profesor Only Routes */}
          <Route
            path="/profesor/*"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['profesor', 'admin']}>
                  <div className="p-8 text-center">
                    <h1 className="text-3xl font-bold">Panel de Profesor</h1>
                    <p className="text-gray-600 mt-2">Gestión de quizzes y clases</p>
                  </div>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Estudiante Routes */}
          <Route
            path="/estudiante/*"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['estudiante', 'admin']}>
                  <div className="p-8 text-center">
                    <h1 className="text-3xl font-bold">Panel de Estudiante</h1>
                    <p className="text-gray-600 mt-2">Mis quizzes y progreso</p>
                  </div>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Catch all - 404 */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-gray-900">404</h1>
                  <p className="text-xl text-gray-600 mt-4">Página no encontrada</p>
                  <a href="/dashboard" className="text-indigo-600 hover:underline mt-4 block">
                    Volver al Dashboard
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
