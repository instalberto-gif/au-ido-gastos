import {validTravelId,readLinkedTravel} from './travel-links.mjs';
export function requireExpenseTravel(trip){if(!validTravelId(trip?.travelId))throw Error('Vincula esta cuenta a un viaje existente antes de guardar.');return trip.travelId}
export async function verifyExpenseTravel(api,trip){const target=requireExpenseTravel(trip);
 // Mantener una vinculación ya guardada permite que el grupo edite las cuentas
 // sin ampliar los permisos del viaje privado al que pertenecen.
 if(trip.revision){const rows=await api('/rest/v1/au_ido_trips?id=eq.'+encodeURIComponent(trip.id)+'&select=data&limit=1');if(rows[0]?.data?.travelId===target)return}
 await readLinkedTravel(api,target);
}
