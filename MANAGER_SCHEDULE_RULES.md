# MANAGER_SCHEDULE_RULES.md

**Contrato canónico del sistema de horario gerencial**  
Última actualización: 2026-01-17

---

## 🎯 Principio fundamental

> El planner gerencial describe **intención**, no realidad operativa.  
> La realidad se mide en el planner operativo.  
> Aquí solo se **declara**.

---

## 📐 Casos límite (cerrados)

### 1️⃣ Vacaciones / Licencia vs asignación gerencial

**Regla absoluta:**  
`VACACIONES` y `LICENCIA` anulan cualquier asignación.

**Comportamiento:**
- Si existe VAC o LIC → **no se puede asignar** Día / Noche / Inter / Monitoreo
- La celda:
  - Muestra `VAC` o `LIC`
  - Es **no editable**
  - Tooltip explica la razón

**Prohibido:**
- ❌ "Medio día"
- ❌ "Solo vino a monitorear"
- ❌ Excepciones heroicas

**Implementación técnica:**
```typescript
// Precedencia en resolveEffectiveManagerDay():
// 1. VACACIONES / LICENCIA (bloquean TODO)
// 2. Plan gerencial
// 3. UNDEFINED
```

---

### 2️⃣ Vacaciones iniciando en día OFF

**Regla:**  
Las vacaciones/licencias **no dependen** del plan semanal.

**Implicaciones:**
- Pueden iniciar cualquier fecha:
  - OFF
  - Feriado
  - Sin asignación previa
- El sistema **NO valida** contra duty previo

**Resultado:**
- ✅ Se registran sin restricción
- ✅ Bloquean desde esa fecha
- ✅ El planner gerencial se ajusta automáticamente

---

### 3️⃣ UNDEFINED (el vacío administrativo)

**Semántica:**
- No se planificó
- No hay información
- **No hay estado implícito**

**Qué NO hace:**
- ❌ No cuenta como OFF
- ❌ No cuenta como falta
- ❌ No cuenta como error

**UI:**
- Label: `—` (guión largo)
- Sin tooltip
- Sin acción al click
- Color: gris neutro (`#9CA3AF`)

**Regla clave:**
```
undefined ≠ OFF
undefined = "No hay dato, y está bien"
```

👉 Es una **señal para gerencia**, no para el sistema.

---

### 4️⃣ Intermedio y Monitoreo no son medio turno

**Regla:**  
`INTER` y `MONITOR` son **estados atómicos, no combinables**.

**Prohibido:**
- ❌ Día + Inter
- ❌ Noche + Monitoreo
- ❌ Inter + Monitoreo

**Si necesitan combinaciones:**  
→ Crear **nuevo estado**, no hacks.

**Implementación:**
```typescript
// Un duty por día
// Reemplazo completo, no merge
schedule.days[date] = { duty, note }
```

---

### 5️⃣ Múltiples managers el mismo día

**Regla:**  
El sistema **no valida exclusividad** entre managers.

**Ejemplo válido:**
```
Angela      → Día
Supervisor B → Monitoreo
```

✅ **Correcto**  
❌ El sistema **no decide jerarquías humanas**

**Justificación:**  
La gerencia puede tener múltiples roles activos simultáneamente.

---

### 6️⃣ Overrides gerenciales y comentarios

**Regla:**  
Los overrides **pueden tener comentario**.

**Comportamiento:**
- Comentario es **opcional**
- Si existe → tooltip con 📝
- Si no existe → silencio (sin tooltip)

**Validación:**
- Trim automático
- Máximo 300 caracteres
- Sin regex, sin palabras prohibidas

**Regla clave:**
> Comentario no cambia lógica, solo **contexto histórico**.

---

### 7️⃣ Swaps, covers, y cosas raras

**Regla dura:**  
El horario gerencial **NO participa en swaps**.

**Prohibido:**
- ❌ No cubre
- ❌ No intercambia
- ❌ No "me cambió el turno"

**Si la gerencia quiere eso:**  
→ Otro módulo, otro dominio.

**Justificación:**  
Swaps son para operación diaria, no para agenda gerencial.

---

### 8️⃣ Puntos, métricas, castigos

**Regla absoluta:**  
Horario gerencial **nunca afecta métricas operativas**.

**No participa en:**
- ❌ Suma de puntos
- ❌ Resta de puntos
- ❌ Cálculo de déficit de cobertura
- ❌ Estadísticas operativas

**Semántica:**
> Es **agenda**, no disciplina.

---

### 9️⃣ Borrado de managers

**Regla:**  
Si se borra o desactiva un manager:

- ✅ Se conserva el **historial completo**
- ✅ Se muestra como inactivo
- ❌ **No** se recalcula nada

**Principio:**
> Historia > limpieza estética.

**Implementación:**
```typescript
// managementSchedules[managerId] permanece
// UI filtra por manager.active si es necesario
```

---

### 🔟 Persistencia por fecha exacta

**Regla:**  
El horario gerencial es **por fecha exacta**, no semanal.

**Implicaciones:**
- ❌ No hay "patterns" semanales
- ❌ No se copia a otras semanas
- ✅ Cada fecha es **independiente**

**Estructura:**
```typescript
interface ManagerWeeklyPlan {
  managerId: string
  days: Record<ISODate, ManagerPlanDay>
}
```

**Justificación:**  
Evita "bugs fantasma" por copias implícitas.

---

## 🧠 Invariantes del sistema

### Precedencia de resolución (inmutable)

```
1. VACACIONES / LICENCIA  → Bloquea todo, se muestra VAC/LIC
2. Plan gerencial         → Duty explícito (DAY/NIGHT/INTER/MONITOR)
3. UNDEFINED              → Guión (—), sin estado implícito
```

**Código:**
```typescript
// src/application/ui-adapters/resolveEffectiveManagerDay.ts
// Ver comentarios en archivo para precedencia exacta
```

---

## 🎨 Contrato visual

Ver: `src/ui/management/managerDutyUI.ts`

**Mapa de colores (NO MODIFICAR):**

| Estado     | Label  | Fondo      | Texto      | Borde      |
|------------|--------|------------|------------|------------|
| DAY        | Día    | `#FEF3C7`  | `#92400E`  | default    |
| NIGHT      | Noche  | `#E0E7FF`  | `#3730A3`  | default    |
| INTER      | Inter  | `#DCFCE7`  | `#166534`  | default    |
| MONITORING | Mon    | `#F3E8FF`  | `#6B21A8`  | default    |
| VACATION   | VAC    | `#ECFEFF`  | `#0E7490`  | `#67E8F9`  |
| LICENSE    | LIC    | `#F5F3FF`  | `#5B21B6`  | `#C4B5FD`  |
| UNDEFINED  | —      | transparent| `#9CA3AF`  | default    |

---

## 🛡️ Validaciones

### Comentarios
- **Opcional** (nunca bloqueante)
- Trim automático
- Max 300 caracteres
- Sin regex, sin palabras prohibidas

### Duty assignment
- Un duty por día
- Reemplazo completo (no merge)
- Comentario se conserva si no se reemplaza explícitamente

**Código:**
```typescript
// src/domain/management/validation.ts
export function validateManagerNote(note: string | undefined): string | undefined
```

---

## 🚫 Qué NO se implementa (nunca)

Lista explícita para evitar "mejoras" futuras:

1. ❌ Comentario obligatorio
2. ❌ Color distinto por cada tipo de comentario
3. ❌ Historial por celda (quién editó cuándo)
4. ❌ Confirmación modal por cada cambio
5. ❌ Validación de exclusividad entre managers
6. ❌ Integración con swaps
7. ❌ Métricas operativas
8. ❌ Puntos/castigos
9. ❌ Patterns semanales
10. ❌ Estados combinados (DAY+INTER)

**Justificación:**  
Matan usabilidad sin resolver problemas reales.

---

## 📦 Archivos clave

| Archivo | Propósito |
|---------|-----------|
| `src/domain/management/types.ts` | Tipos canónicos |
| `src/domain/management/validation.ts` | Validaciones + invariantes |
| `src/application/ui-adapters/resolveEffectiveManagerDay.ts` | Precedencia de resolución |
| `src/application/ui-adapters/mapManagerDayToCell.ts` | Mapper visual |
| `src/ui/management/managerDutyUI.ts` | Contrato visual |
| `src/store/managementScheduleSlice.ts` | Store slice |

---

## ✅ Estado del sistema

**Implementado:**
- ✅ Tipos y validaciones
- ✅ Resolver con precedencia correcta
- ✅ Mapper visual con colores canónicos
- ✅ Store slice con inicialización segura
- ✅ UI de visualización (ManagementPlanner)

**Pendiente:**
- ⏳ UI de edición (click → asignar duty)
- ⏳ Bloqueo visual en VAC/LIC
- ⏳ Validación pre-guardado
- ⏳ Export/impresión

---

## 🔒 Regla madre

> **El planner gerencial describe intención, no realidad operativa.**  
> **La realidad se mide en el planner operativo.**  
> **Aquí solo se declara.**

Si una regla contradice esto → la regla está mal.

---

**Fin del contrato.**  
Modificaciones requieren consenso explícito y actualización de este documento.
