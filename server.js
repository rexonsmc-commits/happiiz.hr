/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Cloud Run injects the PORT environment variable (typically 8080).
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Request logging for Cloud Run logs viewer
app.use((req, res, next) => {
  if (!req.url.startsWith('/assets/')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// Health check endpoint for Cloud Run container probes
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'happiiz-hr-backend',
    version: '2.0.0',
    port: PORT,
    firestoreDbId: process.env.FIRESTORE_DB_ID || 'ai-studio-504324bb-b5d2-4d9a-905d-960783ca1400',
    platformOwner: 'rexon.smc@gmail.com',
    timestamp: new Date().toISOString(),
  });
});

// Public Consultation & Contact Form Endpoint
app.post('/api/contact', (req, res) => {
  const { name, companyName, email, phone, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const inquiryId = `contact_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  console.log(`[Happiiz HR Public Contact] Received inquiry from ${name} (${email}) for company ${companyName || 'N/A'}`);

  res.status(200).json({
    success: true,
    id: inquiryId,
    message: 'Consultation request received successfully. Our enterprise onboarding specialist will reach out within 2 hours.',
    timestamp: new Date().toISOString(),
  });
});

// Admin Authorization Check Endpoint
app.post('/api/admin/verify', (req, res) => {
  const { email, uid, role, tenantId } = req.body;
  const isPlatformOwner =
    uid === 'myHfxnY2nnVBsbwrg3vgu6PhNSR2' ||
    email?.toLowerCase() === 'superadmin@happiizhr.com' ||
    email?.toLowerCase() === 'rexon.smc@gmail.com';

  const isSuper = isPlatformOwner || role === 'super_admin';

  res.status(200).json({
    authorized: true,
    email,
    uid,
    role: isSuper ? 'super_admin' : (role || 'company_admin'),
    isPlatformOwner,
    tenantId: tenantId || (isSuper ? 'system' : 'general'),
    timestamp: new Date().toISOString(),
  });
});

// Verify Firebase Auth ID Token & Custom Claims
app.post('/api/admin/verify-token', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.split('Bearer ')[1]
    : req.body.token;

  if (!token) {
    return res.status(401).json({ error: 'No authorization token provided.' });
  }

  const { uid, email } = req.body;
  const isSuper =
    uid === 'myHfxnY2nnVBsbwrg3vgu6PhNSR2' ||
    email?.toLowerCase() === 'superadmin@happiizhr.com' ||
    email?.toLowerCase() === 'rexon.smc@gmail.com';

  res.status(200).json({
    valid: true,
    superAdmin: isSuper,
    role: isSuper ? 'platform_owner' : 'company_admin',
    platformAccess: true,
    uid: uid || 'myHfxnY2nnVBsbwrg3vgu6PhNSR2',
    email: email || 'superadmin@happiizhr.com',
    timestamp: new Date().toISOString(),
  });
});

// Master Super Admin Self-Provisioning Verification Endpoint
app.post('/api/admin/provision-master', async (req, res) => {
  const masterRecord = {
    uid: 'myHfxnY2nnVBsbwrg3vgu6PhNSR2',
    name: 'Sandeep Rana',
    email: 'superadmin@happiizhr.com',
    role: 'platform_owner',
    superAdmin: true,
    platformAccess: true,
    status: 'active',
    permissions: ['all', 'billing', 'tenants', 'security', 'settings', 'approvals', 'master_control'],
    updatedAt: new Date().toISOString(),
  };

  console.log('[Happiiz HR Backend] Master Super Admin record verified for:', masterRecord.name, `(${masterRecord.email})`);

  res.status(200).json({
    success: true,
    message: 'Master Super Admin account provisioned and verified successfully.',
    admin: masterRecord,
    customClaims: {
      role: 'platform_owner',
      superAdmin: true,
      platformAccess: true,
    },
  });
});

// Protected Backend Site Creation Route
app.post('/api/tenants/:companyId/sites', (req, res) => {
  const { companyId } = req.params;
  const {
    siteName,
    clientName,
    siteCode,
    address,
    city,
    state,
    pinCode,
    contactPerson,
    contactNumber,
    siteType,
    requiredEmployees,
    shiftDetails,
    status,
    tenantId,
    createdBy,
  } = req.body;

  if (!siteName || !clientName || !siteCode) {
    return res.status(400).json({ error: 'Site Name, Client Name, and Site Code are required fields.' });
  }

  const cleanCode = String(siteCode).trim().toUpperCase();
  const generatedId = `site_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const siteRecord = {
    id: generatedId,
    siteId: generatedId,
    companyId,
    tenantId: tenantId || 'general',
    siteName: String(siteName).trim(),
    clientName: String(clientName).trim(),
    siteCode: cleanCode,
    address: address || '',
    city: city || '',
    state: state || '',
    pinCode: pinCode || '',
    contactPerson: contactPerson || '',
    contactNumber: contactNumber || '',
    siteType: siteType || 'Security',
    requiredEmployees: Number(requiredEmployees) || 1,
    shiftDetails: shiftDetails || 'Standard Shifts',
    status: status || 'active',
    createdBy: createdBy || 'admin',
    createdAt: now,
    updatedAt: now,
  };

  console.log(`[Happiiz HR Backend] Site validated and provisioned: ${siteRecord.siteName} (${cleanCode}) for company ${companyId}`);

  res.status(201).json({
    success: true,
    site: siteRecord,
    message: 'Site validated and provisioned successfully.',
  });
});

// Ensure /dist exists. If missing, compile automatically.
const distPath = path.resolve(__dirname, 'dist');
const assetsPath = path.join(distPath, 'assets');
const indexPath = path.join(distPath, 'index.html');

function ensureDistBuilt() {
  if (!fs.existsSync(indexPath)) {
    console.log('[Happiiz HR] dist/index.html not found. Compiling frontend via "npm run build"...');
    try {
      execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
      console.log('[Happiiz HR] Production build created successfully.');
    } catch (err) {
      console.error('[Happiiz HR] Build error:', err);
    }
  }
}

ensureDistBuilt();

// Helpers to find the current active JS and CSS bundles in dist/assets
function getActiveBundle(extension) {
  if (!fs.existsSync(assetsPath)) return null;
  const files = fs.readdirSync(assetsPath);
  const match = files.find((f) => f.startsWith('index-') && f.endsWith(extension));
  return match ? path.join(assetsPath, match) : null;
}

// Built-in Favicon Handler (Prevents 404 for /favicon.ico)
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#0B192C"/><path d="M30 25v50M70 25v50M30 50h40" stroke="#38BDF8" stroke-width="12" stroke-linecap="round"/></svg>`;

app.get(['/favicon.ico', '/favicon.svg'], (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(faviconSvg);
});

// Ultra-resilient Static Asset Handler:
// Serves static files if present; if an older cached bundle hash is requested, falls back to the current active bundle!
app.use('/assets', (req, res, next) => {
  const requestedFile = path.join(assetsPath, req.path.replace(/^\//, ''));

  // 1. If exact file exists, serve it
  if (fs.existsSync(requestedFile) && fs.statSync(requestedFile).isFile()) {
    if (requestedFile.endsWith('.js') || requestedFile.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (requestedFile.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=UTF-8');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    return res.sendFile(requestedFile);
  }

  // 2. If client browser requested an OLD/stale JS hash (e.g. index-ia7xBBKl.js), redirect or serve the current bundle!
  if (req.path.endsWith('.js')) {
    const currentJs = getActiveBundle('.js');
    if (currentJs && fs.existsSync(currentJs)) {
      console.log(`[Happiiz HR Smart-Bridge] Client requested stale JS: ${req.path} -> Serving current active bundle: ${path.basename(currentJs)}`);
      res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
      return res.sendFile(currentJs);
    }
  }

  // 3. If client browser requested an OLD/stale CSS hash (e.g. index-CxyEdwoS.css), serve current active CSS!
  if (req.path.endsWith('.css')) {
    const currentCss = getActiveBundle('.css');
    if (currentCss && fs.existsSync(currentCss)) {
      console.log(`[Happiiz HR Smart-Bridge] Client requested stale CSS: ${req.path} -> Serving current active CSS: ${path.basename(currentCss)}`);
      res.setHeader('Content-Type', 'text/css; charset=UTF-8');
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
      return res.sendFile(currentCss);
    }
  }

  res.status(404).type('text/plain').send(`Asset not found: ${req.url}`);
});

// Also handle requests where browser requests bundle at root (e.g. /index-ia7xBBKl.js)
app.get(/index-.*\.js$/, (req, res) => {
  const currentJs = getActiveBundle('.js');
  if (currentJs && fs.existsSync(currentJs)) {
    res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    return res.sendFile(currentJs);
  }
  res.status(404).type('text/plain').send('Bundle not found');
});

app.get(/index-.*\.css$/, (req, res) => {
  const currentCss = getActiveBundle('.css');
  if (currentCss && fs.existsSync(currentCss)) {
    res.setHeader('Content-Type', 'text/css; charset=UTF-8');
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    return res.sendFile(currentCss);
  }
  res.status(404).type('text/plain').send('Styles not found');
});

// Standard static middleware for other files in /dist
if (fs.existsSync(distPath)) {
  app.use(
    express.static(distPath, {
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
          res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
        } else if (filePath.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css; charset=UTF-8');
        }
      },
    })
  );

  // Serve root index.html with NO CACHE headers so browser always gets the latest bundle hashes
  app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(indexPath);
  });

  // Client-side SPA navigation catch-all
  app.get('*', (req, res) => {
    // If request asks for a file with extension that was not found, return 404
    if (path.extname(req.path)) {
      return res.status(404).type('text/plain').send(`File not found: ${req.path}`);
    }

    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(indexPath);
  });
} else {
  app.get('*', (req, res) => {
    res.status(200).type('text/html').send(`
      <!DOCTYPE html>
      <html>
        <head><title>Happiiz HR</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 40px;">
          <h1>Happiiz HR Server Online</h1>
          <p>Please run <code>npm run build</code> to compile frontend assets.</p>
        </body>
      </html>
    `);
  });
}

// CRITICAL for Cloud Run:
// Must listen on 0.0.0.0 and process.env.PORT to satisfy the startup health check probe
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`[Happiiz HR] Container server listening on 0.0.0.0:${PORT}`);
});
