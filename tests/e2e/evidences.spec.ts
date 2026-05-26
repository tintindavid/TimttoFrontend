import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { login, attachAuthToBrowser, AuthSession } from './helpers/auth';

const REPORT_ID = process.env.PLAYWRIGHT_REPORT_ID || '';
const FIXTURE = path.resolve(__dirname, 'fixtures/evidence-sample.jpg');
const FIXTURE_NAME = 'evidence-sample.jpg';

test.describe('SCRUM-4 — Report evidences', () => {
  let session: AuthSession;
  let createdEvidenceIds: string[] = [];

  test.beforeAll(async () => {
    if (!REPORT_ID) throw new Error('Set PLAYWRIGHT_REPORT_ID to an existing report _id.');
    if (!fs.existsSync(FIXTURE)) throw new Error(`Missing fixture: ${FIXTURE}`);
    session = await login();
  });

  test.afterAll(async () => {
    // Cleanup: remove every evidence we created during the run.
    for (const id of createdEvidenceIds) {
      await session.api
        .delete(`/reports/${REPORT_ID}/evidencias/${id}`)
        .catch(() => undefined);
    }
    await session.api.dispose();
  });

  test('upload via API → ViewReportPage shows thumbnail → gallery opens → delete via API', async ({
    context,
    page,
  }) => {
    // 1. Upload one evidence via the new API
    const buffer = fs.readFileSync(FIXTURE);
    const uploadResp = await session.api.post(`/reports/${REPORT_ID}/evidencias`, {
      multipart: {
        evidencias: { name: FIXTURE_NAME, mimeType: 'image/jpeg', buffer },
      },
    });
    expect(uploadResp.ok(), `upload failed: ${uploadResp.status()} ${await uploadResp.text()}`).toBe(
      true
    );
    const uploaded = await uploadResp.json();
    const evidencias: Array<{ _id: string; nombre: string; url: string }> =
      uploaded?.data?.evidencias ?? [];
    expect(evidencias.length).toBeGreaterThan(0);
    const newOne = evidencias[evidencias.length - 1];
    createdEvidenceIds.push(newOne._id);

    // 2. Drive the UI — authenticated via injected localStorage
    await attachAuthToBrowser(context, session);
    await page.goto(`/reports/${REPORT_ID}/view`);

    // 3. The new thumbnail is rendered
    const thumbnail = page.locator(`img[src="${newOne.url}"]`).first();
    await expect(thumbnail).toBeVisible({ timeout: 15_000 });

    // 4. Click thumbnail → gallery modal opens
    await thumbnail.click();
    const modal = page.locator('.modal-dialog');
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('img')).toHaveAttribute('src', newOne.url);

    // 5. ESC closes the modal
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();

    // 6. Delete via API and reload — the thumbnail should be gone
    const delResp = await session.api.delete(
      `/reports/${REPORT_ID}/evidencias/${newOne._id}`
    );
    expect(delResp.ok()).toBe(true);
    createdEvidenceIds = createdEvidenceIds.filter((id) => id !== newOne._id);

    await page.reload();
    await expect(page.locator(`img[src="${newOne.url}"]`)).toHaveCount(0);
  });

  test('upload rejects a 4th file (cap enforcement) and non-JPEG (MIME enforcement)', async () => {
    // Fill the report up to the cap (3 evidences).
    const buffer = fs.readFileSync(FIXTURE);

    // Find current count
    const getResp = await session.api.get(`/reports/${REPORT_ID}`);
    expect(getResp.ok()).toBe(true);
    const reportBody = await getResp.json();
    const existing: Array<{ _id: string }> = reportBody?.data?.evidencias ?? [];

    // Top up to exactly 3 (one POST per file — Playwright's multipart value
    // is a single file, not an array; the backend already supports both)
    const slotsToFill = Math.max(0, 3 - existing.length);
    const knownIds = new Set(existing.map((e) => e._id));
    for (let i = 0; i < slotsToFill; i++) {
      const fillResp = await session.api.post(`/reports/${REPORT_ID}/evidencias`, {
        multipart: {
          evidencias: { name: FIXTURE_NAME, mimeType: 'image/jpeg', buffer },
        },
      });
      expect(fillResp.ok()).toBe(true);
      const after = await fillResp.json();
      for (const e of (after?.data?.evidencias ?? []) as Array<{ _id: string }>) {
        if (!knownIds.has(e._id)) {
          knownIds.add(e._id);
          createdEvidenceIds.push(e._id);
        }
      }
    }

    // 4th upload must be rejected (cap)
    const overResp = await session.api.post(`/reports/${REPORT_ID}/evidencias`, {
      multipart: {
        evidencias: { name: FIXTURE_NAME, mimeType: 'image/jpeg', buffer },
      },
    });
    expect(overResp.status()).toBe(400);
    const overBody = await overResp.json();
    const code = overBody?.error?.code || overBody?.code;
    expect(code).toBe('EVIDENCE_LIMIT_EXCEEDED');

    // Non-JPEG/PNG must be rejected
    const badResp = await session.api.post(`/reports/${REPORT_ID}/evidencias`, {
      multipart: {
        evidencias: {
          name: 'evidence-sample.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('%PDF-1.4 fake'),
        },
      },
    });
    expect(badResp.status()).toBe(400);
    const badBody = await badResp.json();
    const badCode = badBody?.error?.code || badBody?.code;
    expect(badCode).toBe('INVALID_FILE_TYPE');
  });
});
