import { describe, expect, it } from 'vitest';
import { router } from './router';

describe('app router', () => {
  it('declares expected top-level routes', () => {
    expect(router.routes).toHaveLength(2);
    expect(router.routes[0].path).toBe('/');
    expect(router.routes[1].path).toBe('/app');

    const appChildren = router.routes[1].children ?? [];
    expect(appChildren.some((route) => route.path === 'pipeline')).toBe(true);
    expect(appChildren.some((route) => route.path === 'inbox')).toBe(true);
    expect(appChildren.some((route) => route.path === 'calendar')).toBe(true);
    expect(appChildren.some((route) => route.path === 'archive')).toBe(true);
    expect(appChildren.some((route) => route.path === 'trip/:tripId')).toBe(true);
  });
});
