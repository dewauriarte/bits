

# 🔷 SPRINT 8: Mascotas + Colección (Semanas 15-16)

## 🎯 Objetivos

* Sistema de mascotas con habilidades activas
* Vista "Yo + Mi Mascota" en dashboard
* Galería de colección con stats
* Mascotas dan bonificaciones reales en juego

---

## 📦 Backend Tasks

### **Pet System Core**

* [ ] Poblar tabla `pets` con catálogo inicial
  * 5 common (CSS sprites)
  * 3 uncommon (Lottie)
  * 2 rare (Rive)
  * 1 epic (Rive avanzado)
  * 1 legendary (Three.js 3D)
  * Definir abilities en JSONB para cada uno
* [ ] `GET /api/pets` - Catálogo de mascotas
  * Listar todas las mascotas disponibles
  * Filtros: rarity, category
  * Incluir: name, description, abilities, unlock_requirements
  * Indicar si user ya la tiene (owned: true/false)
* [ ] `GET /api/pets/:id` - Detalle de mascota
  * Info completa
  * Stats de habilidades
  * Preview de animación (sprite_url/lottie_url)
  * Evolution stages (3 etapas)
  * XP requerida para evolucionar
* [ ] `POST /api/pets/adopt` - Adoptar mascota
  * Validar currency suficiente
  * Validar unlock_requirements (level, achievement)
  * Crear en user_pets
  * Restar currency
  * Return: mascota adoptada
* [ ] `PUT /api/pets/:userPetId/activate` - Activar mascota
  * Marcar is_active = true en user_pets
  * Desactivar otras mascotas (solo 1 activa)
  * Return: mascota activa

### **Pet Abilities Integration**

* [ ] Método `applyPetBonus(userId, baseReward)`
  * Obtener mascota activa del usuario
  * Leer abilities de la mascota
  * Aplicar bonuses:
    * xp_boost: baseXP * (1 + boost/100)
    * coin_finder: baseCoins * (1 + boost/100)
    * luck_boost: mejorar RNG de drops
  * Return: recompensas mejoradas
* [ ] Integrar en EndGame rewards
  * Llamar a applyPetBonus antes de otorgar rewards
  * Mostrar breakdown: "Base: 100 XP, Pet Bonus: +15 XP"
* [ ] Sistema de Happiness
  * Happiness decae 5 puntos por día sin interactuar
  * Restaurar con "Feed Pet" (cuesta 50 coins)
  * Happiness < 50 → habilidades al 50%
  * Happiness = 100 → habilidades al 100%

### **Pet Progression**

* [ ] `POST /api/pets/:userPetId/feed` - Alimentar mascota
  * Restaurar happiness a 100
  * Costo: 50 coins
  * Actualizar last_interaction
  * Incrementar times_fed
  * Return: nueva happiness
* [ ] Pet gana XP con el jugador
  * Cada juego completado: pet gana 10% del XP del jugador
  * Actualizar current_xp en user_pets
  * Check si alcanza next evolution stage
  * Auto-evolve si cumple XP requerida
* [ ] Método `evolvePet(userPetId)`
  * Verificar current_xp >= xp_to_next_stage
  * Incrementar evolution_stage (1→2→3)
  * Actualizar sprite_url al siguiente stage
  * Mejorar abilities (+5% por evolución)
  * Crear notificación "Your pet evolved!"
  * Animación especial de evolución

### **Endpoints**

* [ ] `GET /api/users/pets` - Mascotas del usuario
* [ ] `GET /api/users/pets/active` - Mascota activa
* [ ] `POST /api/pets/adopt` - Adoptar
* [ ] `PUT /api/pets/:id/activate` - Activar
* [ ] `POST /api/pets/:id/feed` - Alimentar
* [ ] `GET /api/pets/:id/stats` - Stats de mascota

### **Testing Backend**

* [ ] Tests de adopción
* [ ] Tests de bonificaciones aplicadas
* [ ] Tests de evolución
* [ ] Tests de happiness decay

---

## 🎨 Frontend Tasks

### **Pet Collection Page**

* [ ] PetGallery (/pets)
  * Grid de mascotas disponibles
  * Owned vs Not Owned (locked)
  * Filtros: rarity, category, owned
  * Empty state para comenzar colección
* [ ] PetCard component
  * Animación de la mascota (sprite/Lottie/Rive/3D)
  * Nombre + rareza
  * Badge "Owned" o "Locked"
  * Stats preview (XP boost, coin finder)
  * Click: abrir detalles

### **Pet Detail Modal**

* [ ] PetDetailView component
  * Animación grande de la mascota
  * Nombre + descripción + lore
  * **Stats detallados:**
    * Abilities (iconos + porcentajes)
    * Current level
    * Evolution stage (1/3)
    * XP progress bar hacia siguiente etapa
    * Happiness meter (corazones)
    * Games played together
  * Botones:
    * "Adopt" (si no la tiene)
    * "Activate" (si la tiene pero no activa)
    * "Feed" (si happiness < 100)
    * "View Evolution Stages" (preview 3 formas)

### **Dashboard Integration**

* [ ] "Yo + Mi Mascota" section
  * Avatar del usuario a la izquierda
  * Mascota activa a la derecha (animada)
  * Ambos sobre un mini-escenario
  * Happiness hearts flotando
  * Botón "Change Pet"
* [ ] PetStatusWidget
  * Mini card de mascota activa
  * Level + XP bar
  * Happiness hearts
  * Active bonuses destacados:
    * "+15% XP" badge
    * "+10% Coins" badge
  * Click: abrir detalles rápidos

### **Pet Animations**

* [ ] CSS Sprite Animation (Common)
  * Idle animation (4 frames loop)
  * 200px × 200px sprites
* [ ] Lottie Integration (Uncommon)
  * Import Lottie component
  * Loop animation suave
* [ ] Rive Integration (Rare/Epic)
  * State machine: idle, happy (happiness > 80), sad (< 50)
  * Interactive (click para reacción)
* [ ] Three.js 3D (Legendary)
  * Modelo 3D rotable con mouse
  * Iluminación dinámica
  * Sombras suaves

### **Evolution Animation**

* [ ] PetEvolutionScreen component
  * Fullscreen overlay
  * Mascota brillando con partículas
  * Transformación de stage 1 → 2 → 3
  * Sound effect épico
  * "Your pet evolved!" con confetti
  * Mostrar nuevos stats mejorados
  * Botón "Amazing!"

### **Pet Shop Section**

* [ ] Shop tab "Pets"
  * Grid de mascotas adoptables
  * Precio en coins/gems
  * Locked si no cumple level
  * Preview de abilities
  * Botón "Adopt Now"

### **Testing Frontend**

* [ ] Tests de adopción flow
* [ ] Tests de activar mascota
* [ ] Tests de animaciones

---

## ✅ Criterios de Aceptación

* [ ] Usuario puede ver catálogo de mascotas
* [ ] Usuario puede adoptar mascotas con coins/gems
* [ ] Usuario puede activar 1 mascota a la vez
* [ ] Mascota activa aparece en dashboard junto al avatar
* [ ] Mascota da bonificaciones reales (+XP, +coins)
* [ ] Usuario puede ver stats de cada mascota
* [ ] Mascotas evolucionan al ganar XP
* [ ] Happiness afecta efectividad de habilidades
* [ ] Usuario puede alimentar mascotas
* [ ] Animaciones funcionan según rareza (sprite/Lottie/Rive/3D)
* [ ] UI muestra "Yo + Mi Mascota" claramente

---
