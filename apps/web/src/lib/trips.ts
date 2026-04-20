export type { TripStage, Trip } from './types';
export { TRIPS as tripsFixture, TRAVELERS, TRIP_DETAILS } from './data';

export const activeTrips = (trips: import('./types').Trip[]) =>
  trips.filter((t) => t.stage !== 'archived');

export const findTripById = (trips: import('./types').Trip[], id: string) =>
  trips.find((t) => t.id === id);
