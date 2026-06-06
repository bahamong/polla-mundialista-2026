# 🏆 Polla Mundialista FIFA World Cup 2026

Plataforma web tipo **quiniela / polla** para el Mundial FIFA 2026. Los
participantes predicen los resultados de los 104 partidos, suman puntos por sus
aciertos y compiten en una tabla de clasificación. El sistema maneja las fases
del torneo, el cierre automático de apuestas 1 hora antes de cada partido, la
carga de resultados, el cálculo automático de puntos y la eliminación de
participantes por puntaje mínimo.

Construido con **Next.js (App Router) + TypeScript + Tailwind CSS** y
**Supabase** (Auth, PostgreSQL, RLS y Realtime). Desplegable en **Vercel**.

---

## ✨ Funcionalidades

- Registro e inicio de sesión con Supabase Auth.
- Creación automática de perfil al registrarse (trigger en `auth.users`).
- **El primer usuario registrado se convierte en `superadmin`** automáticamente.
- Bloqueo de participación hasta que el cupo/pago sea aprobado.
- Apuestas por partido: **gana local / empate / gana visitante**.
- **Cierre automático de apuestas 1 hora antes** (validado en frontend, backend y RLS).
- Carga de resultados reales y **cálculo automático de puntos** (1 punto por acierto, configurable).
- **Recálculo** ante correcciones de resultados.
- Tabla de clasificación en tiempo real (Supabase Realtime).
- **Eliminación por fases** según puntaje mínimo configurable.
- Fases con **placeholders** (`1A vs 2B`, `Ganador P73 vs Ganador P74`) hasta definir los clasificados reales.
- Panel de administración completo (usuarios, pagos, equipos, partidos, resultados, reglas, configuración).
- Seguridad con **Row Level Security** en todas las tablas.

---

## 🧱 Stack

| Capa        | Tecnología                                   |
|-------------|----------------------------------------------|
| Frontend    | Next.js 15 (App Router), React 19, TypeScript |
| Estilos     | Tailwind CSS + componentes estilo shadcn/ui  |
| Iconos      | lucide-react                                 |
| Backend/DB  | Supabase (PostgreSQL, Auth, RLS, Realtime)   |
| Fechas      | date-fns                                      |
| Despliegue  | Vercel                                        |

---

## 🚀 Puesta en marcha local

### 1. Requisitos
- Node.js 18+ (probado en Node 24)
- Un proyecto en [Supabase](https://supabase.com)

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar la base de datos
En el **SQL Editor** de tu proyecto Supabase, ejecuta en orden:
1. `supabase/schema.sql`  → tablas, funciones, triggers, RLS, vistas, realtime.
2. `supabase/seed.sql`    → grupos, 48 selecciones y 104 partidos (editables).

> Las migraciones también pueden aplicarse con la CLI de Supabase
> (`supabase db push`) o el MCP de Supabase.

### 4. Variables de entorno
Copia `.env.example` a `.env.local` y completa:
```env
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_publishable_o_anon
SUPABASE_SERVICE_ROLE_KEY=        # opcional para este MVP
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
> `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` están en
> **Supabase → Project Settings → API**.

### 5. Ejecutar
```bash
npm run dev
```
Abre http://localhost:3000

### 6. Crear el administrador
**Regístrate primero** desde `/register`: ese primer usuario será `superadmin`
activo automáticamente. Los siguientes serán participantes con cupo pendiente.

> Para promover a alguien manualmente:
> ```sql
> update public.profiles set role='admin', status='active' where email='correo@ejemplo.com';
> ```

---

## ▲ Despliegue en Vercel

1. Sube el repositorio a GitHub.
2. En Vercel: **Add New → Project** e importa el repo.
3. Configura las variables de entorno (las mismas de `.env.local`), ajustando:
   ```
   NEXT_PUBLIC_SITE_URL=https://tu-app.vercel.app
   ```
4. En **Supabase → Authentication → URL Configuration** agrega tu dominio de
   Vercel a *Site URL* y *Redirect URLs* (`https://tu-app.vercel.app/auth/callback`).
5. Deploy. Vercel detecta Next.js automáticamente.

---

## 🔐 Modelo de seguridad (RLS)

- Cada usuario solo ve/edita su propio perfil (no puede cambiar su `role`/`status`: trigger anti-escalada).
- Cada usuario solo crea/edita **sus** predicciones, y **solo antes del cierre** del partido.
- Solo administradores aprueban pagos, gestionan equipos/partidos/resultados/reglas y recalculan puntos.
- El ranking es visible para participantes; existe una función pública
  `pm_public_leaderboard()` (sin datos sensibles) para la landing.

---

## 🗂️ Estructura del proyecto

```
src/
├─ app/
│  ├─ page.tsx                 # Landing pública
│  ├─ login/ register/         # Autenticación
│  ├─ auth/callback/           # Confirmación de correo
│  └─ (app)/                   # Área autenticada (navbar + guard)
│     ├─ dashboard/            # Estado del cupo, stats, próximos partidos
│     ├─ matches/ [id]/        # Listado y detalle de partidos + apuesta
│     ├─ my-predictions/       # Historial de predicciones
│     ├─ leaderboard/          # Clasificación (realtime)
│     ├─ rules/ profile/       # Reglas y perfil
│     └─ admin/                # Panel admin (8 secciones)
├─ components/                 # UI, navbar, match-card, formularios…
└─ lib/
   ├─ supabase/                # Clientes browser/server/middleware
   ├─ actions/                 # Server actions (predicciones, pagos, admin)
   ├─ queries.ts types.ts constants.ts utils.ts
supabase/
├─ schema.sql                  # Esquema completo reproducible
└─ seed.sql                    # Datos iniciales del Mundial 2026
```

---

## 📋 Reglas de negocio

1. Un usuario sin cupo aprobado no puede apostar.
2. Un usuario eliminado no puede apostar en fases posteriores (conserva puntos e historial).
3. Una predicción por partido; editable solo antes del cierre (1 h antes).
4. Los puntos se calculan solo cuando el partido está **finalizado**.
5. El ranking y las estadísticas se actualizan tras cada resultado.
6. Si se corrige un resultado, los puntos se recalculan.
7. Las fases de eliminación no permiten apuestas hasta definir sus equipos.
8. El administrador modifica reglas y configuración sin tocar el código.

---

## ⚖️ Aviso legal

Esta plataforma es para una participación **interna, privada y recreativa**.
Participa solo si eres mayor de edad. No automatiza pagos ni premios con dinero
real; los cupos se gestionan manualmente por el organizador. Al registrarse, el
usuario acepta los términos y el uso responsable.

---

Hecho con ❤️ usando Next.js + Supabase.
