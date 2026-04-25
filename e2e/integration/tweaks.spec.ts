import { expect, test } from '@playwright/test';

test.describe('TweaksPanel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/pipeline');
    await expect(page.getByText('Travel OS')).toBeVisible();
    await page.locator('.sidebar button.nav-item', { hasText: 'Tweaks' }).click();
    await expect(page.locator('.tweaks-panel')).toBeVisible();
  });

  test('renders theme, accent, and density controls', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Light' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dark' })).toBeVisible();
    await expect(page.locator('.tweaks-panel').getByText('Accent')).toBeVisible();
    await expect(page.locator('.tweaks-panel').getByText('Density')).toBeVisible();
  });

  test('switching to dark theme sets data-theme="dark" on html element', async ({ page }) => {
    await page.getByRole('button', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('switching back to light removes dark theme', async ({ page }) => {
    await page.getByRole('button', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.getByRole('button', { name: 'Light' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('changing accent swatch updates CSS variable', async ({ page }) => {
    const getAccent = () =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
      );

    const defaultAccent = await getAccent();
    await page.locator('button[title="Olive"]').click();
    const newAccent = await getAccent();
    expect(newAccent).not.toBe(defaultAccent);
    expect(newAccent).toContain('oklch');
  });

  test('panel closes when Tweaks button is clicked again', async ({ page }) => {
    await page.locator('.sidebar button.nav-item', { hasText: 'Tweaks' }).click();
    await expect(page.locator('.tweaks-panel')).not.toBeVisible();
  });

  test('close button dismisses the panel', async ({ page }) => {
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.locator('.tweaks-panel')).not.toBeVisible();
  });
});
