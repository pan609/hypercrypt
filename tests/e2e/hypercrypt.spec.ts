import fs from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test.describe('HyperCrypt E2E & Standalone Offline Export Verification', () => {
  test('full Browse play, Author edit + Atkinson Dither, Skin toggle, and offline standalone .html verification', async ({
    page,
    context,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
    });

    await page.goto('/');
    await expect(page.getByTestId('window-title')).toContainText('The Attic Mac of 1987 — Attic (1/6)');

    // 1. Solve Card 1 puzzle via invisible hotspot + modal + Wake HyperCard
    await page.getByRole('button', { name: 'MacSpirit' }).click();
    await expect(page.getByTestId('ht-modal')).toContainText('Boot floppy inserted');
    await page.getByRole('button', { name: 'Awesome!' }).click();
    await page.getByRole('button', { name: 'Wake HyperCard' }).click();
    await expect(page.getByTestId('window-title')).toContainText('Boot Floppy (2/6)');

    // 2. Advance to Card 3 (Time Dial) and test `ask` modal with "1987"
    await page.getByRole('button', { name: 'Open Time Dial' }).click();
    await expect(page.getByTestId('window-title')).toContainText('Time Dial (3/6)');
    await page.getByRole('button', { name: 'Enter Year' }).click();
    await expect(page.getByTestId('ht-modal')).toContainText('What year did Apple launch HyperCard?');
    await page.getByTestId('ht-modal').getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Continue to Circuit' })).toBeVisible();

    // 3. Toggle Kiroween Dusk skin
    await page.getByRole('button', { name: 'Kiroween Dusk' }).click();
    await expect(page.locator('.hc-app')).toHaveAttribute('data-hc-theme', 'kiroween');

    // 4. Switch to Author Mode, inspect AST Tree & test Atkinson Dither Modal + Message Box
    await page.getByRole('button', { name: 'Author' }).click();
    await page.getByRole('tab', { name: 'AST' }).click();
    await page.getByRole('button', { name: /Dither Img/i }).click();
    await expect(page.getByRole('dialog', { name: 'Atkinson 1-Bit Dither Importer' })).toBeVisible();
    await page.getByRole('button', { name: 'Stamp onto Active Card' }).click();

    await page.getByRole('button', { name: /Msg/i }).click();
    await page.getByTestId('msgbox-input').fill('go to first card');
    await page.getByTestId('msgbox-input').press('Enter');
    await expect(page.getByTestId('window-title')).toContainText('Attic (1/6)');

    // 4b. Open Stack Flow Map & Live Markdown Compiler views
    await page.getByRole('button', { name: 'Map', exact: true }).click();
    await expect(page.getByTestId('stack-map-view')).toBeVisible();
    await page.getByRole('button', { name: 'MD → Stack', exact: true }).click();
    await expect(page.getByTestId('md-studio-view')).toBeVisible();
    await page.getByTestId('md-open-studio').click();
    await expect(page.getByTestId('window-title')).toContainText('502 Alert Received (1/5)');

    // 5. Switch to Starlight Cavern RPG via the top Showcase Dock and verify Engine HUD
    await page.getByTestId('showcase-dock').getByRole('button', { name: /1-Bit RPG/i }).click();
    await expect(page.getByTestId('window-title')).toContainText('Cavern Gate (1/6)');
    await expect(page.getByTestId('engine-hud')).toBeVisible();

    // Switch back to Prod 502 Triage Runbook via Showcase Dock for offline single-file HTML export verification
    await page.getByTestId('showcase-dock').getByRole('button', { name: /SRE Runbook/i }).click();
    await expect(page.getByTestId('window-title')).toContainText('502 Alert Received (1/5)');

    // 6. Export Single-File .html and verify it runs 100% OFFLINE in a fresh browser page!
    await page.getByRole('button', { name: 'Browse' }).click();
    await page.getByRole('button', { name: /Export/i }).click();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('menuitem', { name: /Export Single-File .html/i }).click(),
    ]);
    const filePath = await download.path();
    expect(filePath).toBeTruthy();
    const exportedHtml = await fs.readFile(filePath!, 'utf-8');
    expect(exportedHtml).toContain('Exported by HyperCrypt');

    const offlinePage = await context.newPage();
    offlinePage.on('pageerror', (err) => errors.push(`offline pageerror: ${err.message}`));
    // Block all external network requests to prove true offline immortality
    await offlinePage.route('**/*', (route) => route.abort());
    await offlinePage.setContent(exportedHtml, { waitUntil: 'domcontentloaded' });

    await expect(offlinePage.locator('#hc-title')).toContainText('502 Alert Received (1/5)');
    // Verify offline dark/light theme sync updates root <html> data-hc-theme cleanly (P0-3!)
    const initialHtmlTheme = await offlinePage.locator('html').getAttribute('data-hc-theme');
    await offlinePage.locator('#hc-theme-toggle').click();
    const toggledHtmlTheme = await offlinePage.locator('html').getAttribute('data-hc-theme');
    expect(toggledHtmlTheme).not.toBe(initialHtmlTheme);

    await offlinePage.getByRole('button', { name: 'Recent Deploy (<15m)' }).click();
    await expect(offlinePage.locator('#hc-title')).toContainText('Check Rollback (2/5)');
    await offlinePage.close();

    expect(errors).toEqual([]);
  });
});
