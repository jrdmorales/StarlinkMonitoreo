# Auditoría de código — 2026-07-02

Revisión completa de bugs, inconsistencias, bugs silenciosos y vulnerabilidades sobre `Backend/src` y `Frontend/src` (working tree en `main`, commit `ab84fed`).

Estado: **18 de 18 hallazgos corregidos** (2026-07-02). Solo queda pendiente #4 (token en localStorage — cambio de arquitectura, fuera de esta pasada). `tsc --noEmit`, `vite build` y `tsc` (backend build) verificados sin errores tras cada tanda de cambios.

---

## 🔴 Seguridad — crítico

### 1. ✅ CORREGIDO — Frontend: check de admin solo verificaba login, no rol
`Frontend/src/pages/Ajustes.tsx:19`, `Frontend/src/components/antennas/AntennaDetail.tsx:20`, `Frontend/src/components/layout/Sidebar.tsx:21`

Cualquier usuario autenticado con rol `viewer` era tratado como admin: veía y podía usar la UI de CRUD completa (obras/antenas en Ajustes), el botón "Enviar alerta" en `AntennaDetail`, y disparaba fetches a `/admin/obras` y `/admin/antennas`.

**Fix**: `isAdmin` ahora deriva de `getTokenPayload()?.role === 'admin'` en los 3 archivos. Import de `token` retirado en `Ajustes.tsx` (quedó sin uso).

**Verificado**: backend ya re-validaba rol server-side vía `requireAdmin` en todos los routes `/admin/*` (`Backend/src/api/middleware/auth.ts:22-35`). El bug era exposición de UI/fetches innecesarios a viewers, no fuga de datos ni escalación real — las mutaciones ya devolvían 403.

### 2. ✅ CORREGIDO — Backend: `pool.on('error')` ausente
`Backend/src/db/client.ts`

Pool de `pg` sin listener de error → cualquier hiccup de conexión (restart DB, network blip) se convertía en excepción no capturada → **crash total del proceso**.

**Fix**:
```ts
pool.on('error', (err) => {
  console.error('[DB] Error inesperado en pool de conexiones:', err);
});
```

### 3. ✅ CORREGIDO — Backend: protección "último admin" contaba usuarios totales, no admins
`Backend/src/api/routes/admin/users.ts:101-106`, `Backend/src/db/repositories/user.repo.ts`

`DELETE /admin/users/:id` usaba `countUsers()` (todos los roles) para decidir si el usuario a borrar es "el único admin". Hoy es inalcanzable en la práctica (el guard de auto-eliminación siempre deja vivo al admin que llama), pero la lógica no verificaba lo que su propio mensaje de error afirma — cualquier refactor futuro del guard de auto-eliminación reabre el riesgo de dejar el sistema sin admins.

**Fix**: nueva función `countAdmins()` en `user.repo.ts` (cuenta solo `role = 'admin'`), usada en el check en vez de `countUsers()`.

### 4. Token de sesión en `localStorage`
`Frontend/src/api/client.ts:2-8`

**No corregido** — expuesto a exfiltración si existe cualquier vector XSS. No explotable hoy sin un XSS conocido; migrar a cookie httpOnly es cambio de arquitectura mayor, no se tocó en esta pasada.

---

## 🟠 Bugs silenciosos

### 5. ✅ CORREGIDO — Bucketing de fecha en UTC en vez de hora Chile
`Backend/src/services/consumption.service.ts:155,198`

Usaba `toISOString().slice(0,10)` (UTC) pese a que `cycle.ts` ya documentó y arregló exactamente este bug con `formatDateISO()`. El cron de fetch corre 20:00 Chile = 00:00 UTC → la muestra de la tarde/noche se bucketizaba en el día siguiente.

**Fix**: ambos puntos ahora usan `formatDateISO(new Date(log.sampledAt))`.

### 6. ✅ CORREGIDO — Cálculo de ciclo de facturación dependía del TZ del proceso, no de Chile
`Backend/src/lib/cycle.ts:16-36`, `docker-compose.yml`

`getCurrentCycle()` usa `now.getDate()/getMonth()/getFullYear()`, dependientes del TZ del sistema. No había `TZ` seteado en ningún lado — default de Docker es UTC. Los cron jobs sí fijaban `timezone: 'America/Santiago'` pero el cálculo de ciclo no, pudiendo saltar de mes hasta 4h antes de tiempo.

**Fix**: agregado `TZ: America/Santiago` al `environment` del servicio `backend` en `docker-compose.yml`. Fija el TZ de todo el proceso Node, no solo los cron.

### 7. ✅ CORREGIDO — `updateAntennaLimit()` definido pero nunca invocado
`Backend/src/api/routes/admin/antennas.ts` (POST `/`), `Backend/src/db/repositories/antenna.repo.ts:53`

`POST /api/admin/antennas` reusaba `upsertAntenna()`, que a propósito no actualiza `limitGb` en conflictos (protege contra que el sync de New Relic pise ediciones manuales). Esto también bloqueaba que un admin fijara el límite vía creación/reactivación desde el panel: `201` sin error, pero límite viejo.

**Fix**: tras `upsertAntenna()`, si `antenna.limitGb !== body.data.limitGb` se llama `updateAntennaLimit()` explícitamente — la intención del admin en este endpoint siempre prevalece.

### 8. ✅ CORREGIDO (columna eliminada) — Historial (sparkline) permanentemente vacío
`Frontend/src/components/antennas/AntennaTable.tsx`, `Frontend/src/pages/Antenas.tsx`, `Frontend/src/pages/ObraDetail.tsx`

Ambas páginas pasaban `histories={{}}` hardcodeado → columna "Historial" siempre vacía. No existe endpoint batched de historial por antena (traerlo por fila sería N+1 nuevo), así que en vez de dejar una feature a medias se **eliminó la columna y el prop `histories`** de `AntennaTable`. De paso se corrigió el punto #13 (formato `limitGb` sin `fmtGB()`) en el mismo archivo.

### 9. ✅ CORREGIDO — Auto-selección de antena rota en carga fría
`Frontend/src/pages/ObraDetail.tsx`

`useState(defaultSel)` con init lazy solo corría en el primer render. En refresh de página o deep-link directo a `/obras/:key`, `useObras()` aún no había resuelto → antena "más riesgosa" nunca se auto-seleccionaba.

**Fix**: `useEffect` que setea `selected` cuando `obra` pasa de `undefined` a definido (solo si `selected` sigue `null`). De paso se agregó manejo de `error` explícito (antes quedaba en "Cargando..." infinito ante fallo real de fetch — era el punto #14 original).

### 10. ✅ CORREGIDO — Proyección de fleet usaba `daysLeft` de una sola antena
`Frontend/src/pages/Consumo.tsx`

`remainingDays = Math.min(...daysLeft)` aplicado al promedio diario agregado de toda la flota subestimaba el total cuando una antena resetea antes que el resto (podía mostrar "dentro del límite" cuando la flota iba a exceder cuota).

**Fix**: ahora suma `projection.projectedTotal` de cada antena (ya calculado server-side con el `daysLeft` propio de cada una) en vez de reinventar el cálculo en el frontend con un único `daysLeft` global.

---

## 🟡 Inconsistencias

| # | Ubicación | Estado |
|---|---|---|
| 11 | `Frontend/src/pages/AlertsLog.tsx` | ✅ Dedup key ahora incluye `antennaCode` (antes `obraKey-threshold-date` colapsaba antenas distintas). Contador "Enviadas (N)" ahora refleja el total deduplicado/filtrado visible, no el crudo. |
| 12 | `Frontend/src/pages/Ajustes.tsx` (`deactivateAntenna`) | ✅ Ahora invalida `['obras']` además de `['admin-antennas']` — el resto del dashboard ya no muestra antenas desactivadas hasta expirar cache. |
| 13 | `Frontend/src/components/ui/DonutGauge.tsx` | ✅ Nuevo prop opcional `status`; `AntennaDetail` lo pasa desde `antenna.status` (mismo criterio que `StatusBadge`/`UsageBar`). Overview sigue calculando desde `pct` porque no tiene un status agregado real. |
| 14 | `Frontend/src/components/antennas/AntennaTable.tsx` | ✅ `limitGb` ahora usa `fmtGB()` (resuelto junto con #8). |
| 15 | `Backend/src/services/alert.service.ts` | ✅ Contador `skipped` corregido: ahora resta antenas-nuevas-alertadas (sumadas por antena) de antenas-sobre-umbral, en vez de mezclar conteo de obras con conteo de antenas. |
| 16 | `Backend/src/services/email.service.ts` | ✅ `buildAlertSubject` y el estilo de header del email ya no hardcodean 60/80/100 — el tier (primer aviso / advertencia / límite alcanzado) se deriva de la posición del umbral dentro de `ALERT_THRESHOLDS` configurado (`min`/`max` del array). |
| 17 | `Backend/src/api/routes/admin/starlink.ts` | ✅ `obraId` en alta de cuenta Starlink ahora se valida contra `obras` existentes antes de insertar — typo ya no crea cuenta huérfana silenciosa. |
| — | `Frontend/app.jsx`, `components.jsx`, `data.jsx` (raíz) | ✅ Eliminados — confirmado dead code (nada los importaba), lógica vieja divergente de los mismos nombres de componente en `src/`. |
| — | `Frontend/src/hooks/useAuth.ts` | ✅ Eliminados `logout()`/`isAuthenticated` sin uso — quedaban divergentes del logout real (`Sidebar.tsx`, SPA navigate sin reload). Solo se usaba `login`. |
| 18 | `Backend/src/services/consumption.service.ts`, `Backend/src/api/routes/admin/obras.ts` | ✅ N+1 eliminado. Nueva `getLatestConsumptionForAntennaIds()` (`consumption.repo.ts`) usa `DISTINCT ON` para traer el último snapshot de todas las antenas en una sola query — `buildAntennaDto()` ahora es síncrona y recibe el dato ya cargado. `admin/obras.ts` reemplaza el `COUNT` por obra (`Promise.all` de N queries) por un único `GROUP BY antennas.obraId`. `refreshConsumption()` (loop de New Relic, corre en cron, no en cada carga de página) se dejó igual — batchearlo requiere rediseñar el upsert masivo, desproporcionado para esta pasada. |

---

## Pendiente

- **#4** — token en `localStorage` (requiere decidir si migrar a cookie httpOnly; cambio de arquitectura, no trivial).

---

*Generado por auditoría asistida (2 agentes: backend + frontend). Hallazgos verificados manualmente contra el código fuente antes de aplicar cada fix. `tsc --noEmit` (Backend y Frontend) y `vite build` corridos limpios después de todos los cambios.*
