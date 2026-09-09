import { FarmMapRecord } from '../types';

/**
 * Retorna verdadero si el cuadro de diálogo de la inspección ha sido editado y contiene texto real.
 * Si está vacío o sin modificar, la finca será omitida del PDF consolidado.
 */
export function isFarmInspectionEdited(map: FarmMapRecord): boolean {
  if (!map) return false;
  const notes = (map.nightInspection?.observations || '').trim();
  if (!notes) return false;
  if (notes.startsWith('Operación nocturna')) return false;
  return true;
}

/**
 * Divide un conjunto de fincas en dos listas:
 * - readyMaps: Fincas con cuadro de diálogo editado (se incluirán en el consolidado)
 * - omittedMaps: Fincas pendientes de editar (omitidas del consolidado)
 */
export function partitionFarmMaps(maps: FarmMapRecord[]): {
  readyMaps: FarmMapRecord[];
  omittedMaps: FarmMapRecord[];
} {
  const readyMaps: FarmMapRecord[] = [];
  const omittedMaps: FarmMapRecord[] = [];

  for (const map of maps) {
    if (isFarmInspectionEdited(map)) {
      readyMaps.push(map);
    } else {
      omittedMaps.push(map);
    }
  }

  return { readyMaps, omittedMaps };
}
