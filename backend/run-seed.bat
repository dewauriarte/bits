@echo off
echo ======================================
echo   🌱 EJECUTANDO SEED DE BASE DE DATOS
echo ======================================
echo.

echo 📦 Instalando dependencias si es necesario...
call npm install

echo.
echo 🔄 Generando cliente de Prisma...
call npx prisma generate

echo.
echo 🚀 Ejecutando seed...
call npm run seed

echo.
echo ======================================
echo   ✅ SEED COMPLETADO EXITOSAMENTE!
echo ======================================
echo.
echo Los siguientes datos fueron creados:
echo - 1 Admin (admin / Admin123!)
echo - 2 Profesores
echo - 10 Estudiantes
echo - Clases de ejemplo
echo - Materias
echo - 5 Tableros de Mario Party:
echo   • Aventura en la Selva
echo   • Viaje Espacial
echo   • Reino Submarino
echo   • Castillo Encantado
echo   • Desierto Mágico
echo.
pause
