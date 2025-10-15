import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gamepad2, Github, Twitter, Mail } from 'lucide-react';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-lg"
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              AppQuiz
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/about"
              className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
            >
              Sobre Nosotros
            </Link>
            <Link
              to="/features"
              className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
            >
              Características
            </Link>
            <Link
              to="/contact"
              className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
            >
              Contacto
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
            >
              Iniciar Sesión
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-bold text-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  AppQuiz
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Plataforma educativa gamificada para hacer el aprendizaje más divertido.
              </p>
              <div className="flex gap-3">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-indigo-600 hover:text-white transition-colors"
                >
                  <Github className="w-4 h-4" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-indigo-600 hover:text-white transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href="mailto:contact@appquiz.com"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-indigo-600 hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Producto</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/features" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                    Características
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                    Precios
                  </Link>
                </li>
                <li>
                  <Link to="/roadmap" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                    Roadmap
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Compañía</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/about" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                    Sobre Nosotros
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                    Contacto
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/terms" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                    Términos de Servicio
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                    Política de Privacidad
                  </Link>
                </li>
                <li>
                  <Link to="/cookies" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                    Política de Cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500">
              © {new Date().getFullYear()} AppQuiz. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
