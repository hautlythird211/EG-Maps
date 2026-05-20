import { test, expect } from '@playwright/test';

test.describe('Earth Guardians - All Routes and Features', () => {
  test.describe('Home Page (/)', () => {
    test('should load home page with all elements', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveTitle(/Earth Guardians/);

      // Check main title - use exact match to avoid strict mode violation
      await expect(page.getByText('Earth Guardians', { exact: true })).toBeVisible();
      await expect(page.getByText('Interactive Data Visualization Platform')).toBeVisible();

      // Check dataset cards
      await expect(page.getByRole('heading', { name: 'Project Grants' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Endangered Species' })).toBeVisible();

      // Check icons are rendering (SVG elements with lucide class)
      const svgIcons = page.locator('svg.lucide');
      await expect(svgIcons.first()).toBeVisible();
      const iconCount = await svgIcons.count();
      expect(iconCount).toBeGreaterThan(0);

      // Check links work
      const projectGrantsLink = page.locator('a[href="/project-grants"]').first();
      await expect(projectGrantsLink).toBeVisible();

      const endangeredSpeciesLink = page.locator('a[href="/endangered-species"]').first();
      await expect(endangeredSpeciesLink).toBeVisible();
    });

    test('should have working navigation dock', async ({ page }) => {
      await page.goto('/');

      // Check dock navigation items
      const dockNav = page.locator('nav.fixed');
      await expect(dockNav).toBeVisible();

      // Check nav items exist - use first() to avoid strict mode violations
      await expect(page.locator('nav a[href="/info"]').first()).toBeVisible();
      await expect(page.locator('nav a[href="/project-grants"]').first()).toBeVisible();
      await expect(page.locator('nav a[href="/endangered-species"]').first()).toBeVisible();
      await expect(page.locator('nav a[href="https://www.earthguardians.org/crews"]').first()).toBeVisible();

      // Check dark mode toggle button
      const darkModeToggle = page.locator('nav button').first();
      await expect(darkModeToggle).toBeVisible();
    });
  });

  test.describe('Info Page (/info)', () => {
    test('should load info page with feedback form', async ({ page }) => {
      await page.goto('/info');
      await expect(page).toHaveTitle(/Info.*Feedback/);

      // Check header - use specific selector
      await expect(page.locator('h1 span').first()).toBeVisible();

      // Check info cards
      await expect(page.getByRole('heading', { name: 'Project Grants' }).first()).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Endangered Species' }).first()).toBeVisible();

      // Check icons are rendering
      const svgIcons = page.locator('svg.lucide');
      await expect(svgIcons.first()).toBeVisible();

      // Check feedback form - use placeholder instead of label
      await expect(page.getByText('Feedback', { exact: true })).toBeVisible();
      await expect(page.getByPlaceholder('Enter your name')).toBeVisible();
      await expect(page.getByPlaceholder('Share your thoughts')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Submit Feedback' })).toBeVisible();

      // Check join CTA
      await expect(page.getByText('Want to Make a Difference?')).toBeVisible();
      await expect(page.locator('a[href="https://www.earthguardians.org/crews"]').first()).toBeVisible();
    });

    test('should navigate to project grants from info page', async ({ page }) => {
      await page.goto('/info');
      await page.getByRole('link', { name: 'View 2D Map' }).first().click();
      await page.waitForURL(/\/project-grants/);
      await expect(page).toHaveURL(/\/project-grants/);
    });

    test('should navigate to endangered species from info page', async ({ page }) => {
      await page.goto('/info');
      const speciesLinks = page.getByRole('link', { name: 'View 2D Map' });
      await speciesLinks.nth(1).click();
      await page.waitForURL(/\/endangered-species/);
      await expect(page).toHaveURL(/\/endangered-species/);
    });
  });

  test.describe('Project Grants Pages', () => {
    test('should load project grants index page', async ({ page }) => {
      await page.goto('/project-grants');
      await expect(page).toHaveTitle(/Project Grants/);

      // Wait for ClientOnly to hydrate and show the nav
      await page.waitForSelector('nav', { state: 'visible', timeout: 20000 });

      // Check navigation dock is present
      await expect(page.locator('nav').first()).toBeVisible();

      // Check icons are rendering
      const svgIcons = page.locator('svg.lucide');
      const iconCount = await svgIcons.count();
      expect(iconCount).toBeGreaterThan(0);
    });

    test('should load project grants 3d page', async ({ page }) => {
      await page.goto('/project-grants/3d');
      await expect(page).toHaveTitle(/Project Grants.*3D/);

      // Check navigation dock is present
      await expect(page.locator('nav').first()).toBeVisible({ timeout: 15000 });
    });

    test('should navigate between 2D and 3D views', async ({ page }) => {
      await page.goto('/project-grants');
      await page.waitForSelector('nav', { state: 'visible', timeout: 20000 });

      // Look for 3D view link
      const view3DLink = page.locator('a[href="/project-grants/3d"]');
      if (await view3DLink.count() > 0) {
        await view3DLink.first().click();
        await expect(page).toHaveURL(/\/project-grants\/3d/);
      }
    });
  });

  test.describe('Endangered Species Pages', () => {
    test('should load endangered species index page', async ({ page }) => {
      await page.goto('/endangered-species');

      // Wait for ClientOnly to hydrate and show the nav
      await page.waitForSelector('nav', { state: 'visible', timeout: 20000 });

      // Check navigation dock is present
      await expect(page.locator('nav').first()).toBeVisible();

      // Check icons are rendering
      const svgIcons = page.locator('svg.lucide');
      const iconCount = await svgIcons.count();
      expect(iconCount).toBeGreaterThan(0);
    });

    test('should load endangered species 3d page', async ({ page }) => {
      await page.goto('/endangered-species/3d');

      // Wait for nav to appear
      await page.waitForSelector('nav', { state: 'visible', timeout: 20000 });

      // Check navigation dock is present
      await expect(page.locator('nav').first()).toBeVisible();
    });
  });

  test.describe('Globe Page (/globe)', () => {
    test('should load globe page', async ({ page }) => {
      await page.goto('/globe');
      await expect(page).toHaveTitle(/Globe/);

      // Check navigation dock is present
      await expect(page.locator('nav').first()).toBeVisible();
    });
  });

  test.describe('Cross-page Navigation', () => {
    test('should navigate from home to all pages and back', async ({ page }) => {
      await page.goto('/');

      // Navigate to info
      await page.locator('nav a[href="/info"]').first().click();
      await expect(page).toHaveURL(/\/info/);

      // Wait for nav on next page
      await page.waitForSelector('nav', { state: 'visible', timeout: 15000 });

      // Navigate to project grants via dock
      await page.locator('nav a[href="/project-grants"]').first().click();
      await expect(page).toHaveURL(/\/project-grants/);

      // Wait for nav
      await page.waitForSelector('nav', { state: 'visible', timeout: 15000 });

      // Navigate to endangered species via dock
      await page.locator('nav a[href="/endangered-species"]').first().click();
      await expect(page).toHaveURL(/\/endangered-species/);

      // Navigate back home via direct navigation
      await page.goto('/');
      await expect(page).toHaveURL('/');
    });

    test('external link should open in new tab', async ({ page }) => {
      await page.goto('/');

      const externalLink = page.locator('a[href="https://www.earthguardians.org/crews"]').first();
      await expect(externalLink).toHaveAttribute('target', '_blank');
      await expect(externalLink).toHaveAttribute('rel', /noopener/);
    });
  });

  test.describe('Dark Mode Toggle', () => {
    test('should have dark mode toggle button visible on all pages', async ({ page }) => {
      const pagesToTest = ['/', '/info', '/project-grants', '/globe'];

      for (const path of pagesToTest) {
        await page.goto(path);
        await page.waitForSelector('nav', { state: 'visible', timeout: 15000 });
        const toggleButton = page.locator('nav button').first();
        await expect(toggleButton).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('No Console Errors', () => {
    test('should not have Icon resolution errors on home page', async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto('/');

      // Filter for Vue warnings about Icon
      const iconWarnings = consoleErrors.filter(err =>
        err.includes('Failed to resolve component: Icon') ||
        err.includes('is missing template')
      );

      expect(iconWarnings).toHaveLength(0);
    });

    test('should not have Icon resolution errors on info page', async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto('/info');

      const iconWarnings = consoleErrors.filter(err =>
        err.includes('Failed to resolve component: Icon') ||
        err.includes('is missing template')
      );

      expect(iconWarnings).toHaveLength(0);
    });
  });

  test.describe('Hydration Mismatches', () => {
    test('should not have hydration mismatches on home page', async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        const text = msg.text();
        if (text.includes('Hydration') || text.includes('hydration') || text.includes('mismatch')) {
          consoleErrors.push(text);
        }
      });

      await page.goto('/');

      expect(consoleErrors).toHaveLength(0);
    });
  });
});
