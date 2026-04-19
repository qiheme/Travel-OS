export type TripStage = 'dreaming' | 'planning' | 'booked' | 'upcoming' | 'archived';

export type Trip = {
  id: string;
  destination: string;
  country: string;
  stage: TripStage;
};

export const tripsFixture: Trip[] = [
  { id: 'tr-kyoto', destination: 'Kyoto', country: 'Japan', stage: 'dreaming' },
  { id: 'tr-lisbon', destination: 'Lisbon', country: 'Portugal', stage: 'planning' },
  { id: 'tr-iceland', destination: 'Reykjavík', country: 'Iceland', stage: 'booked' },
  { id: 'tr-oaxaca', destination: 'Oaxaca', country: 'Mexico', stage: 'upcoming' },
  { id: 'tr-rome', destination: 'Rome', country: 'Italy', stage: 'archived' }
];

export const activeTrips = (trips: Trip[]): Trip[] => trips.filter((trip) => trip.stage !== 'archived');

export const findTripById = (trips: Trip[], tripId: string): Trip | undefined =>
  trips.find((trip) => trip.id === tripId);
