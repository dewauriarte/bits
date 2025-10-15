# 🚀 SPRINTS 7-13: FUNCIONALIDADES COMPLETAS

---

# 🔷 SPRINT 7: Avatares + Tienda + Inventario (Semanas 13-14)

## 🎯 Objetivos

* Sistema de avatares personalizables funcional
* Tienda de items con animaciones llamativas
* Inventario organizado por categorías
* Preview de items en avatar antes de comprar

---

## 📦 Backend Tasks

### **Sistema de Avatares**

* [ ] Modelo de avatar en user_profiles
  * avatar_url (imagen completa)
  * avatar_parts (JSONB con piezas: hair, eyes, clothes, accessories)
  * avatar_frame_url (marco del perfil)
  * Actualizar al equipar items
* [ ] `PUT /api/users/avatar` - Actualizar avatar completo
  * Validar que items pertenecen al usuario
  * Validar que son equipables en avatar
  * Actualizar avatar_url (generar composición)
  * Return: nuevo avatar_url

### **Shop System**

* [ ] `GET /api/shop/items` - Listar items disponibles
  * Filtros: category, rarity, price_range, is_available
  * Paginación (20 items por página)
  * Ordenar por: newest, price_asc, price_desc, rarity
  * Incluir: name, description, image_url, price_coins, price_gems, rarity, stock
* [ ] `GET /api/shop/items/:id` - Detalle de item
  * Info completa del item
  * Preview_url para visualización
  * Stats/habilidades si es pet o boost
  * Required_level, required_achievement_id
  * Times_purchased (popularidad)
* [ ] `POST /api/shop/purchase` - Comprar item
  * Validar que user tiene suficiente currency
  * Validar level requerido
  * Validar stock disponible si es limited
  * Crear transacción en currency_transactions
  * Agregar a user_inventory
  * Guardar en purchase_history
  * Restar currency de user_currencies
  * Actualizar stock si aplica
  * Return: item comprado + nuevo balance

### **Inventory System**

* [ ] `GET /api/inventory` - Ver inventario del usuario
  * Agrupar por categoría (skins, accessories, pets, boosts)
  * Mostrar quantity si es stackable
  * Mostrar is_equipped status
  * Incluir metadata del item
  * Ordenar por: newest, rarity, name
* [ ] `PUT /api/inventory/:id/equip` - Equipar item
  * Validar que item pertenece al usuario
  * Si es skin/accessory: actualizar avatar
  * Si es pet: marcar como activo (desactivar otros)
  * Si es boost: activar efecto
  * Actualizar is_equipped = true
  * Return: avatar actualizado
* [ ] `PUT /api/inventory/:id/unequip` - Desequipar item
  * Quitar del avatar
  * Actualizar is_equipped = false
* [ ] `POST /api/inventory/:id/favorite` - Marcar favorito
  * Toggle is_favorite
  * Para organizar inventario

### **Seeding Inicial**

* [ ] Poblar shop_items con 30-50 items
  * 15 skins (common → legendary)
  * 10 accesorios (hats, glasses, badges)
  * 5 frames de perfil
  * 5 emotes
  * 5 boosts temporales
  * Precios balanceados (100 coins → 5000 coins)

### **Testing Backend**

* [ ] Tests de compra (casos exitosos y errores)
* [ ] Tests de validación de currency
* [ ] Tests de stock limitado
* [ ] Tests de equipar/desequipar

---

## 🎨 Frontend Tasks

### **Avatar System**

* [ ] AvatarBuilder component
  * Vista previa del avatar completo
  * Selector de piezas por categoría
  * Drag & drop de accesorios
  * Botón "Save Avatar"
  * Reset a default
* [ ] AvatarDisplay component
  * Mostrar avatar en dashboard
  * Mostrar en profile
  * Mostrar en leaderboards
  * Tamaños: small (32px), medium (64px), large (128px)
* [ ] AvatarFrame component
  * Marco decorativo alrededor del avatar
  * Animación de brillo según rareza

### **Shop Pages**

* [ ] Shop Main Page (/shop)
  * Grid de items con cards
  * Filtros sidebar (categoría, rareza, precio)
  * Búsqueda por nombre
  * Sort dropdown (newest, price, rarity)
  * Tabs por categoría (All, Skins, Accessories, Frames)
* [ ] ItemCard component
  * Imagen del item
  * Nombre + rareza badge
  * Precio (coins/gems)
  * Rarity glow effect
  * Hover: flip animation suave
  * "Sold Out" overlay si stock = 0
  * Lock icon si required_level no cumplido
* [ ] ItemDetailModal component
  * Imagen grande del item
  * Descripción completa
  * Stats si aplica
  * Preview en avatar ("Try it on")
  * Botón "Buy Now" con precio
  * Botón "Add to Favorites"
  * Animación de entrada (scale + fade)

### **Purchase Flow**

* [ ] PurchaseConfirmation dialog
  * Mostrar item a comprar
  * Precio total
  * Balance actual vs balance después
  * Confirmación: "Are you sure?"
  * Loading state durante compra
* [ ] PurchaseSuccess animation
  * Confetti celebration
  * Item preview animado
  * "Item added to inventory!"
  * Botón "Equip Now" o "View Inventory"

### **Inventory Pages**

* [ ] Inventory Main Page (/inventory)
  * Grid de items owned
  * Tabs por categoría
  * Badge "Equipped" en items activos
  * Filtro "Favorites Only"
  * Empty state amigable si no tiene items
* [ ] InventoryItemCard
  * Similar a ItemCard pero muestra quantity
  * Botón "Equip" o "Unequip"
  * Botón "Favorite" (star icon)
  * Click: abrir detalles

### **Animations**

* [ ] Card flip on hover (Framer Motion)
* [ ] Rarity glow effects (CSS)
  * Common: gris
  * Uncommon: verde
  * Rare: azul
  * Epic: morado
  * Legendary: dorado
* [ ] Purchase confetti (react-confetti)
* [ ] Smooth transitions entre equipar items

### **Testing Frontend**

* [ ] Tests de compra flow
* [ ] Tests de equipar items
* [ ] Tests de filtros

---

## ✅ Criterios de Aceptación

* [ ] Usuario puede ver catálogo de items en shop
* [ ] Usuario puede filtrar y buscar items
* [ ] Usuario puede ver preview de item antes de comprar
* [ ] Usuario puede comprar items con coins o gems
* [ ] Balance se actualiza correctamente tras compra
* [ ] Items comprados aparecen en inventario
* [ ] Usuario puede equipar/desequipar items
* [ ] Avatar se actualiza visualmente al equipar
* [ ] Animaciones son smooth y celebratorias
* [ ] Validaciones funcionan (nivel, currency, stock)

---