# Muscle Tracker - Backend API

Servidor backend para **Muscle Tracker** construido con **Node.js**, **Express**, **TypeScript** y **MySQL**.

---

## 🛠️ Requisitos Previos

- **Node.js** (v20 o superior recomendado, v22 instalado)
- **Docker Desktop** (para levantar la base de datos MySQL)
- **DBeaver** (o cualquier cliente MySQL para gestionar las tablas)

---

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
npm install
```

### 2. Iniciar MySQL con Docker
Asegúrate de que Docker Desktop esté abierto y ejecuta:
```bash
npm run db:up
```
> *(Esto ejecutará `docker compose up -d` y levantará un contenedor con MySQL 8.0)*

Para detener la base de datos en cualquier momento:
```bash
npm run db:down
```

### 3. Iniciar el servidor en modo desarrollo
```bash
npm run dev
```

El servidor estará disponible en:
- **Base URL:** [http://localhost:5000](http://localhost:5000)
- **Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🦫 Conexión desde DBeaver

Para conectarte a la base de datos desde DBeaver:

1. Abre **DBeaver** y haz clic en **Nueva conexión** (icono de enchufe con `+`).
2. Selecciona **MySQL**.
3. Configura los parámetros de conexión:
   - **Host:** `localhost`
   - **Port:** `3306`
   - **Database:** `muscle_tracker_db`
   - **Username:** `tracker_user` *(o `root`)*
   - **Password:** `tracker_password` *(o `rootpassword` si usas root)*
4. En la pestaña **Driver Properties** (o configuración SSL), si te pide "Public Key Retrieval", asegúrate de marcar:
   - `allowPublicKeyRetrieval = true`
5. Haz clic en **Test Connection** y luego en **Finish**.

---

## 📁 Estructura del Proyecto (Clean Architecture por Módulos)

El backend sigue un patrón desacoplado y orientado al dominio:

```text
backend/
├── docker-compose.yml              # Definición del contenedor MySQL 8.0
├── .env                            # Variables de entorno locales
├── .env.example                    # Plantilla de variables de entorno
├── package.json                    # Scripts y dependencias
├── tsconfig.json                   # Configuración de TypeScript
└── src/
    ├── index.ts                    # Punto de entrada y arranque del servidor
    ├── app.ts                      # Configuración de Express, CORS y middlewares
    ├── config/
    │   ├── env.ts                  # Variables de entorno tipadas
    │   └── database.ts             # Pool de conexiones a MySQL (mysql2/promise)
    └── modules/
        └── health/                 # Módulo de ejemplo estructurado
            ├── health.repository.ts        # Contrato / Interfaz del repositorio
            ├── mysql.health.repository.ts  # Implementación concreta en MySQL
            ├── health.usecase.ts           # Lógica de aplicación / Caso de uso
            ├── health.controller.ts        # Controlador HTTP (Express)
            ├── health.dependencies.ts      # Contenedor de inyección de dependencias
            └── health.routes.ts            # Definición de rutas y endpoints
```

### 🧱 Patrón de cada módulo:
1. **`*.repository.ts`**: Define la interfaz/contrato con los métodos que el caso de uso necesita.
2. **`mysql.*.repository.ts`**: Implementa la interfaz interactuando directamente con MySQL.
3. **`*.usecase.ts`**: Orquesta la lógica del negocio, dependiendo únicamente de la interfaz del repositorio.
4. **`*.controller.ts`**: Recibe peticiones HTTP, extrae parámetros, invoca al caso de uso y devuelve la respuesta JSON.
5. **`*.dependencies.ts`**: Instancia el repositorio, le inyecta la implementación al caso de uso y prepara el controlador.
6. **`*.routes.ts`**: Define los endpoints de Express (`GET`, `POST`, etc.) y los conecta a los métodos del controlador.

---

## 📜 Scripts Disponibles

| Script | Descripción |
| :--- | :--- |
| `npm run dev` | Ejecuta el servidor con recarga en caliente (`tsx watch`) |
| `npm run build` | Compila TypeScript a JavaScript en la carpeta `dist/` |
| `npm run start` | Ejecuta la versión compilada en producción |
| `npm run db:up` | Levanta el contenedor de MySQL en segundo plano |
| `npm run db:down` | Detiene y remueve el contenedor de MySQL |
| `npm run db:logs` | Muestra los logs en tiempo real del contenedor MySQL |
