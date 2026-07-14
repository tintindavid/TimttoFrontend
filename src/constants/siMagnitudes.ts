/**
 * Catalog of physical magnitudes and their canonical units, drawn from the
 * International System of Units (SI) — Bureau International des Poids et
 * Mesures (BIPM), 9th edition (2019).
 *
 * Each magnitude lists:
 *   - A `key` (kebab-case, stable identifier used in the DB and in code).
 *   - A Spanish `label` shown to the user.
 *   - `units`: canonical + accepted-with-SI + common non-SI ones actually seen
 *     in medical device verification (mmHg, °C, °F, cmH2O, mL/min, …). Order
 *     matters — most-used-first so the default selection is a good bet.
 *
 * Not exhaustive by design: only what appears in the biomedical fleet TIMTTO
 * services. Add a new magnitude or unit here (never inline) so the trend chart
 * and validators stay consistent.
 */

export interface UnitDef {
  /** Symbol shown in tables, charts and PDFs. e.g. "mmHg". */
  symbol: string;
  /** Full label used in dropdown item text. e.g. "Milímetros de mercurio". */
  label: string;
}

export interface MagnitudeDef {
  key: string;
  /** Spanish label. */
  label: string;
  /** Whether this magnitude is a base SI quantity. Informational only. */
  isBaseSI?: boolean;
  units: UnitDef[];
}

export const SI_MAGNITUDES: MagnitudeDef[] = [
  // ── Base SI ──────────────────────────────────────────────────────────────
  {
    key: 'longitud',
    label: 'Longitud',
    isBaseSI: true,
    units: [
      { symbol: 'mm', label: 'Milímetro' },
      { symbol: 'cm', label: 'Centímetro' },
      { symbol: 'm', label: 'Metro' },
      { symbol: 'μm', label: 'Micrómetro' },
      { symbol: 'in', label: 'Pulgada' },
    ],
  },
  {
    key: 'masa',
    label: 'Masa',
    isBaseSI: true,
    units: [
      { symbol: 'g', label: 'Gramo' },
      { symbol: 'kg', label: 'Kilogramo' },
      { symbol: 'mg', label: 'Miligramo' },
      { symbol: 'μg', label: 'Microgramo' },
      { symbol: 'lb', label: 'Libra' },
    ],
  },
  {
    key: 'tiempo',
    label: 'Tiempo',
    isBaseSI: true,
    units: [
      { symbol: 's', label: 'Segundo' },
      { symbol: 'ms', label: 'Milisegundo' },
      { symbol: 'min', label: 'Minuto' },
      { symbol: 'h', label: 'Hora' },
    ],
  },
  {
    key: 'corriente-electrica',
    label: 'Corriente eléctrica',
    isBaseSI: true,
    units: [
      { symbol: 'A', label: 'Amperio' },
      { symbol: 'mA', label: 'Miliamperio' },
      { symbol: 'μA', label: 'Microamperio' },
    ],
  },
  {
    key: 'temperatura',
    label: 'Temperatura',
    isBaseSI: true,
    units: [
      { symbol: '°C', label: 'Grado Celsius' },
      { symbol: 'K', label: 'Kelvin' },
      { symbol: '°F', label: 'Grado Fahrenheit' },
    ],
  },
  {
    key: 'intensidad-luminosa',
    label: 'Intensidad luminosa',
    isBaseSI: true,
    units: [
      { symbol: 'cd', label: 'Candela' },
      { symbol: 'lx', label: 'Lux (iluminancia)' },
      { symbol: 'lm', label: 'Lumen (flujo luminoso)' },
    ],
  },
  {
    key: 'cantidad-de-sustancia',
    label: 'Cantidad de sustancia',
    isBaseSI: true,
    units: [
      { symbol: 'mol', label: 'Mol' },
      { symbol: 'mmol', label: 'Milimol' },
    ],
  },

  // ── Derived / accepted units common in medical devices ───────────────────
  {
    key: 'presion',
    label: 'Presión',
    units: [
      { symbol: 'mmHg', label: 'Milímetros de mercurio' },
      { symbol: 'cmH2O', label: 'Centímetros de agua' },
      { symbol: 'kPa', label: 'Kilopascal' },
      { symbol: 'hPa', label: 'Hectopascal' },
      { symbol: 'Pa', label: 'Pascal' },
      { symbol: 'bar', label: 'Bar' },
      { symbol: 'psi', label: 'Libra por pulgada cuadrada' },
    ],
  },
  {
    key: 'flujo-volumetrico',
    label: 'Flujo volumétrico',
    units: [
      { symbol: 'mL/min', label: 'Mililitros por minuto' },
      { symbol: 'L/min', label: 'Litros por minuto' },
      { symbol: 'mL/h', label: 'Mililitros por hora' },
      { symbol: 'L/h', label: 'Litros por hora' },
      { symbol: 'mL/s', label: 'Mililitros por segundo' },
    ],
  },
  {
    key: 'volumen',
    label: 'Volumen',
    units: [
      { symbol: 'mL', label: 'Mililitro' },
      { symbol: 'L', label: 'Litro' },
      { symbol: 'μL', label: 'Microlitro' },
      { symbol: 'cm³', label: 'Centímetro cúbico' },
    ],
  },
  {
    key: 'frecuencia',
    label: 'Frecuencia',
    units: [
      { symbol: 'Hz', label: 'Hercio' },
      { symbol: 'kHz', label: 'Kilohercio' },
      { symbol: 'MHz', label: 'Megahercio' },
      { symbol: 'rpm', label: 'Revoluciones por minuto' },
      { symbol: 'bpm', label: 'Latidos por minuto' },
      { symbol: 'rr', label: 'Respiraciones por minuto' },
    ],
  },
  {
    key: 'voltaje',
    label: 'Tensión eléctrica',
    units: [
      { symbol: 'V', label: 'Voltio' },
      { symbol: 'mV', label: 'Milivoltio' },
      { symbol: 'μV', label: 'Microvoltio' },
      { symbol: 'kV', label: 'Kilovoltio' },
    ],
  },
  {
    key: 'resistencia-electrica',
    label: 'Resistencia eléctrica',
    units: [
      { symbol: 'Ω', label: 'Ohmio' },
      { symbol: 'kΩ', label: 'Kiloohmio' },
      { symbol: 'MΩ', label: 'Megaohmio' },
    ],
  },
  {
    key: 'potencia',
    label: 'Potencia',
    units: [
      { symbol: 'W', label: 'Vatio' },
      { symbol: 'mW', label: 'Milivatio' },
      { symbol: 'kW', label: 'Kilovatio' },
      { symbol: 'VA', label: 'Voltiamperio' },
    ],
  },
  {
    key: 'energia',
    label: 'Energía',
    units: [
      { symbol: 'J', label: 'Julio' },
      { symbol: 'kJ', label: 'Kilojulio' },
      { symbol: 'cal', label: 'Caloría' },
      { symbol: 'kcal', label: 'Kilocaloría' },
      { symbol: 'Wh', label: 'Vatio-hora' },
    ],
  },
  {
    key: 'humedad-relativa',
    label: 'Humedad relativa',
    units: [{ symbol: '%HR', label: 'Porcentaje de humedad relativa' }],
  },
  {
    key: 'concentracion-oxigeno',
    label: 'Concentración de oxígeno',
    units: [
      { symbol: '%O₂', label: 'Porcentaje de oxígeno' },
      { symbol: 'FiO₂', label: 'Fracción inspirada de oxígeno' },
    ],
  },
  {
    key: 'saturacion-oxigeno',
    label: 'Saturación de oxígeno',
    units: [{ symbol: '%SpO₂', label: 'Saturación periférica de oxígeno' }],
  },
  {
    key: 'campo-magnetico',
    label: 'Campo magnético',
    units: [
      { symbol: 'T', label: 'Tesla' },
      { symbol: 'mT', label: 'Militesla' },
      { symbol: 'G', label: 'Gauss' },
    ],
  },
  {
    key: 'dosis-radiacion',
    label: 'Dosis de radiación absorbida',
    units: [
      { symbol: 'Gy', label: 'Gray' },
      { symbol: 'mGy', label: 'Miligray' },
      { symbol: 'rad', label: 'Rad' },
    ],
  },
  {
    key: 'dosis-equivalente',
    label: 'Dosis equivalente',
    units: [
      { symbol: 'Sv', label: 'Sievert' },
      { symbol: 'mSv', label: 'Milisievert' },
      { symbol: 'μSv', label: 'Microsievert' },
    ],
  },
  {
    key: 'nivel-sonoro',
    label: 'Nivel sonoro',
    units: [
      { symbol: 'dB', label: 'Decibelio' },
      { symbol: 'dBA', label: 'Decibelio (A-ponderado)' },
    ],
  },
  {
    key: 'ph',
    label: 'pH',
    units: [{ symbol: 'pH', label: 'Potencial de hidrógeno' }],
  },
];

/**
 * Sentinel key/label used when the technician needs to record something not
 * covered by the catalog. Selecting it in the editor unlocks free-text inputs.
 */
export const OTHER_MAGNITUDE_KEY = 'otro';
export const OTHER_MAGNITUDE_LABEL = 'Otro (especificar)';

/** Fast lookup of a magnitude by its label or key (case-insensitive). */
export function findMagnitude(labelOrKey: string): MagnitudeDef | undefined {
  if (!labelOrKey) return undefined;
  const normalized = labelOrKey.trim().toLowerCase();
  return SI_MAGNITUDES.find(
    (m) => m.key === normalized || m.label.toLowerCase() === normalized,
  );
}
