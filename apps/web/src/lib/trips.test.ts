import { describe, expect, it } from 'vitest';
import { activeTrips, findTripById, tripsFixture } from './trips';

describe('trips helpers', () => {
  it('returns only non-archived trips', () => {
    const result = activeTrips(tripsFixture);
    expect(result.every((trip) => trip.stage !== 'archived')).toBe(true);
    expect(result).toHaveLength(4);
  });

  it('finds trip by id and returns undefined when absent', () => {
    expect(findTripById(tripsFixture, 'tr-lisbon')?.destination).toBe('Lisbon');
    expect(findTripById(tripsFixture, 'missing')).toBeUndefined();
  });
});
