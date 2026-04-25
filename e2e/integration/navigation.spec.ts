import { expect, test } from '@playwright/test';

test.describe('Tab navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/pipeline');
    await expect(page.getByText('Travel OS')).toBeVisible();
  });

  test('navigates to Inbox', async ({ page }) => {
    await page.getByRole('link', { name: /Inbox/i }).click();
    await expect(page).toHaveURL(/\/app\/inbox/);
    await expect(page.getByText('Inbox.')).toBeVisible();
  });

  test('navigates to Calendar', async ({ page }) => {
    await page.getByRole('link', { name: /Calendar/i }).click();
    await expect(page).toHaveURL(/\/app\/calendar/);
    await expect(page.getByText('Calendar.')).toBeVisible();
  });

  test('navigates to Archive', async ({ page }) => {
    await page.getByRole('link', { name: /Archive/i }).click();
    await expect(page).toHaveURL(/\/app\/archive/);
    await expect(page.getByText('Archive.')).toBeVisible();
  });

  test('navigates to trip detail page and back to pipeline', async ({ page }) => {
    // Click the Lisbon trip card (uses the .tcard wrapper in the kanban board)
    await page.locator('.pipeline').getByText('Lisbon').first().click();
    await expect(page).toHaveURL(/\/app\/trip\/tr-lisbon/);
    await expect(page.getByRole('heading', { name: 'Lisbon' })).toBeVisible();

    // Navigate back
    await page.getByRole('link', { name: /All trips/i }).click();
    await expect(page).toHaveURL(/\/app\/pipeline/);
  });

  test('trip detail tabs are navigable', async ({ page }) => {
    await page.locator('.pipeline').getByText('Lisbon').first().click();
    await expect(page).toHaveURL(/\/app\/trip\/tr-lisbon/);

    // Click the Bookings tab
    await page.getByRole('tab', { name: /Bookings/i }).click();
    await expect(page.getByRole('heading', { name: 'Bookings', level: 3 })).toBeVisible();

    // Click the Packing tab
    await page.getByRole('tab', { name: /Packing/i }).click();
    await expect(page.getByRole('heading', { name: 'Packing', level: 3 })).toBeVisible();

    // Click the Budget tab
    await page.getByRole('tab', { name: /Budget/i }).click();
    await expect(page.getByRole('heading', { name: 'Budget', level: 3 })).toBeVisible();
  });

  test('sidebar stays visible and active nav item updates on route change', async ({ page }) => {
    await page.getByRole('link', { name: /Inbox/i }).click();
    await expect(page).toHaveURL(/\/app\/inbox/);
    const inboxLink = page.getByRole('link', { name: /Inbox/i });
    await expect(inboxLink).toHaveClass(/active/);
  });
});
