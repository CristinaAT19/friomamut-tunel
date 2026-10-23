# Friomamut · ¿Llegó la fruta al frío?

Pantalla para el jefe de frío: responde de un vistazo si la pulpa del túnel llegó a −1.0 °C y, si no, cuál sonda falta y cuánto le queda.

## Cómo correrlo

```bash
npm install
npm run dev
```

Abre la dirección que muestra la terminal (normalmente http://localhost:5173).
Muestra los datos de `src/data/proceso-133.csv`, que viene fijo en el proyecto. Para ver otro proceso hay que reemplazar ese archivo.

## Estructura

```
src/
  config.ts            objetivo (−1.0 °C) y reglas (saltos, sin señal, cortes…)
  data/proceso-133.csv datos del proceso
  lib/csv.ts           lee y valida el CSV
  lib/analisis.ts      calcula estado, ritmo y avisos de cada sonda y del túnel
  lib/graficos.ts      escalas y trazados SVG (cortan la línea en los huecos)
  components/          lista de sondas, panel del aire, detalles e historial
```

## Reglas (src/config.ts)

| Regla | Valor |
|---|---|
| Salto: cambio imposible entre lecturas seguidas (no cuenta para el ritmo) | ≥ 1.0 °C |
| Sin señal | > 15 min sin lecturas |
| Corte de red | falta más de la mitad de las sondas por ≥ 10 min |
| Inversión de aire | Retorno ≤ Ambiente |
| Pulpa más fría que el aire | pulpa < Ambiente; si es durante una inversión (±2 min) se avisa igual y se anota |
| Ritmo | °C/h de los últimos 30 min, sin contar saltos |

Los huecos cortos no generan avisos y nunca se rellenan datos faltantes.
