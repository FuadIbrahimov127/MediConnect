import type { Gender } from '@mediconnect/shared';

/** SİMA mock-u üçün "Dövlət Şəxsiyyət Bazası": FIN → şəxs. */
export interface GovPerson {
  fin: string;
  firstName: string;
  lastName: string;
  fatherName: string;
  birthDate: string;
  gender: Gender;
}
export const GOV_REGISTRY: GovPerson[] = [
  // Qeydiyyat demosu üçün hələ hesabı olmayan şəxslər:
  { fin: '5AB7CD2', firstName: 'Fuad', lastName: 'İbrahimov', fatherName: 'Rauf', birthDate: '1998-04-17', gender: 'MALE' },
  { fin: '7QW2ER5', firstName: 'Günel', lastName: 'Kərimova', fatherName: 'Elşən', birthDate: '1994-11-02', gender: 'FEMALE' },
  { fin: '2ZX9CV4', firstName: 'Murad', lastName: 'Əsgərov', fatherName: 'Vüqar', birthDate: '1987-06-23', gender: 'MALE' },
  // Dəvət demosu üçün həkim:
  { fin: '8HD3KL1', firstName: 'Samirə', lastName: 'Rzayeva', fatherName: 'Nazim', birthDate: '1985-03-09', gender: 'FEMALE' },
];
