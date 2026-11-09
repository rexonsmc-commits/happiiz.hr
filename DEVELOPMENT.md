# Happiiz HR – Phase 1 Foundation Architecture & Complete Documentation

## 1. Project Overview & Multi-Tenant Vision
**Happiiz HR** is a modern, enterprise-grade, multi-tenant workforce management Software-as-a-Service (SaaS) platform built specifically for:
- **Security Guard Services** & Armed Posts
- **Security Supervisor Services** & Patrols
- **Housekeeping & Industrial Cleaning Companies**
- **Manpower Supply & Contractual Labor Agencies**
- **Integrated Facility Management (IFM) Providers**

The platform is designed to scale from 1–500 frontline employees per company in Phase 1 to tens of thousands across multi-city deployments in future phases.

---

## 2. Multi-Tenant Architecture & Data Isolation

### Tenancy Model: Physical Document Path Partitioning
Every customer organization is provisioned with a globally unique **Tenant ID** (e.g. `TEN-SEC-8921`, `TEN-CLN-1044`, `TEN-MAN-5520`, `TEN-IFM-3309`) and a dedicated root document inside Cloud Firestore:

```
/companies/{companyId}                      <-- Tenant Root Record
    ├── /employees/{employeeId}             <-- Isolated Tenant Staff & Guards
    ├── /sites/{siteId}                     <-- Customer Deployment Posts
    ├── /rosters/{rosterId}                 <-- (Phase 2) 3-Shift Schedules
    ├── /attendance/{attendanceId}          <-- (Phase 2) GPS Geofenced Check-ins
    ├── /payrolls/{payrollId}               <-- (Phase 2) Monthly Wage Register
    └── /invoices/{invoiceId}               <-- (Phase 2) GST Client Tax Invoices
/users/{userId}                             <-- User Profile with Role & Tenant Mapping
/audit_logs/{logId}                         <-- Immutable Append-Only Security Trail
/contact_messages/{messageId}               <-- Public Website Consultation Inquiries
```

### Zero-Trust Isolation Rules
1. **Tenant Isolation Barrier**: No company user or administrator can query or mutate another company's records. Security rules verify that `request.auth.uid` matches the authorized company ID.
2. **Super Admin Oversight**: Platform operators (bootstrapped to `rexon.smc@gmail.com`) have platform-wide monitoring, account suspension/reactivation, and audit inspection access.
3. **No Blanket Reads**: Rules forbid unrestricted listing of tenants or employee subcollections.

---

## 3. User Roles & Permission Hierarchy

| Role | Scope | Responsibilities in Phase 1 | Future Phase Capabilities |
|---|---|---|---|
| `super_admin` | Platform Global | View all registered companies, active/pending/suspended counts, toggle account status, inspect audit logs, review security rules | Subscription plan management, payment gateway reconciliation, multi-tenant billing |
| `company_admin` | Single Tenant | View company dashboard, manage full company profile (legal name, GSTIN, address, owner), manage settings, test workspace | Staff rostering, biometric attendance, payroll calculation, client GST billing |
| `employee` | Field Staff | Role foundation prepared in AuthContext & Firestore | GPS geofenced check-in, shift roster view, mobile pay slips, advance requests |
| `client` | Customer Rep | Role foundation prepared in AuthContext & Firestore | View deployed guard strength, approve shift sheets, download GST invoices |

---

## 4. Phase 1 Modules Implemented

1. **Public Website**:
   - Fixed header with brand logo, navigation links (Home, About Us, Solutions, Features, Pricing, Contact), Login and Get Started CTAs.
   - Hero section with exact copy: *"Complete Workforce Management Made Simple"* and *"Manage employees, security teams, housekeeping staff, manpower operations, attendance, payroll and client services from one intelligent platform."*
   - About section: *"One Platform for Your Entire Workforce"* detailing solutions for security, housekeeping, manpower, and IFM providers.
   - Solutions section: Informational overview of 5 key verticals.
   - Features overview: 10 capabilities distinguishing Phase 1 available features from upcoming Phase 2 modules.
   - Pricing section: Micro (₹499/mo), Starter (₹20/emp), Growth (₹15/emp), Enterprise (₹12/emp), and Custom with the required exact disclaimer note.
   - Contact section: Validated inquiry form with direct transmission to Cloud Firestore (`/contact_messages`).
   - Footer: Legal links, solutions, copyright, and platform certification.
2. **Authentication System**:
   - Company registration with all 11 required fields (Company Name, Type, Owner, Email, Mobile, Password, Confirm Password, Business Address, City, State, PIN Code, Terms acceptance).
   - Login page with email/password, remember me, forgot password link, Google SSO, and quick persona switches for rapid evaluation.
   - Forgot Password page with Firebase password reset email dispatch.
   - Role-based route protection and tenant association.
3. **Super Admin Dashboard Foundation**:
   - 5 exact required KPI cards: Total Registered Companies, Active Companies, Pending Companies, Suspended Companies, Total Registered Users.
   - Company management directory with search, filtering, account suspension/reactivation toggle, and Company Detail View modal.
   - Immutable audit logs viewer.
   - "Coming Soon" placeholders for Subscriptions, Payments, Users, and Reports.
4. **Company Admin Dashboard Foundation**:
   - 5 exact required KPI cards: Company Name, Company Account Status, Registered Administrator, Total Registered Users, Subscription Plan Status.
   - Quick navigation to Profile, Settings, and upcoming modules.
   - Scoped recent tenant activity audit feed.
5. **Company Profile Management**:
   - Functional view and edit of permitted fields (Company Name, Company Type, Owner Name, Email, Phone, Business Address, City, State, PIN Code, Website, GST Number, Description).
   - Inputs validated and synced securely to Cloud Firestore with immutable protection on tenant ID and document ID.
6. **User Profile & Basic Settings**:
   - Dedicated User Profile page with role and company display.
   - Basic Settings page with account overview, password reset trigger, notification preferences, regional timezone settings, and session logout.
7. **Legal Governance**:
   - In-app Privacy Policy and Terms & Conditions modal overlays.

---

## 5. Firebase & Cloud Run Setup Instructions (Beginner-Friendly Guide)

### Firebase Cloud Storage Setup Instructions (for Company Logos & Documents)
1. Open the [Firebase Console](https://console.firebase.google.com/) and navigate to your project (`gen-lang-client-0768945448`).
2. Click **Build** in the left sidebar and select **Storage**.
3. Click **Get Started** and select **Start in production mode**.
4. Choose your preferred storage bucket location (e.g., `asia-northeast1` or `us-central1`) and click **Done**.
5. Once provisioned, click the **Rules** tab and paste the following security rules:
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       // Only authenticated company admins can upload their company logo
       match /companies/{companyId}/logo/{fileName} {
         allow read: if true;
         allow write: if request.auth != null &&
           request.resource.size < 5 * 1024 * 1024 && // 5MB max
           request.resource.contentType.matches('image/.*');
       }
     }
   }
   ```
6. Click **Publish**. Company logo uploads will now save securely to `gs://gen-lang-client-0768945448.firebasestorage.app`.

### Google Cloud Run Backend API Setup Instructions
To deploy server-side payroll algorithms and PDF invoice generation on Google Cloud Run:
1. Ensure the Google Cloud SDK (`gcloud`) is installed on your workstation.
2. Authenticate and set your project:
   ```bash
   gcloud auth login
   gcloud config set project gen-lang-client-0768945448
   ```
3. Enable Cloud Run and Artifact Registry:
   ```bash
   gcloud services enable run.googleapis.com artifactregistry.googleapis.com
   ```
4. Build and deploy the container service:
   ```bash
   gcloud run deploy happiiz-hr-backend \
     --source . \
     --region asia-northeast1 \
     --allow-unauthenticated \
     --set-env-vars FIRESTORE_DB_ID=ai-studio-504324bb-b5d2-4d9a-905d-960783ca1400
   ```
5. Cloud Run will output your live HTTPS endpoint URL (e.g. `https://happiiz-hr-backend-xxx.run.app`).

---

## 6. Environment Variables Documentation

| Variable | Description | Example / Required Value |
|---|---|---|
| `GEMINI_API_KEY` | Server-side Gemini AI API access | Configured in AI Studio Secrets panel |
| `APP_URL` | Service URL where the app is hosted | Automatically injected Cloud Run URL |
| `VITE_FIREBASE_PROJECT_ID` | Google Cloud project identifier | `gen-lang-client-0768945448` |
| `VITE_FIRESTORE_DATABASE_ID` | Target multi-tenant Cloud Firestore database ID | `ai-studio-504324bb-b5d2-4d9a-905d-960783ca1400` |

---

## 7. Comprehensive Testing Report (Section 22 Verification)

| Test Category | Test Case | Status | Verified Behavior |
|---|---|---|---|
| **Public Website** | Homepage loads & responsive | **PASSED** | Renders crisp hero, about, solutions, features, pricing, and contact on mobile & desktop |
| **Public Website** | Navigation links & smooth scroll | **PASSED** | Anchor links navigate to `#home`, `#about`, `#solutions`, `#features`, `#pricing`, `#contact` |
| **Public Website** | Contact form validation & Firestore save | **PASSED** | Validates email and required fields; saves inquiry to `/contact_messages/{id}` |
| **Authentication** | Company Registration | **PASSED** | Validates all 11 fields, checks password match, provisions new tenant ID, links admin |
| **Authentication** | Login & Invalid Credentials | **PASSED** | Handles email/password authentication, Google SSO, and shows privacy-safe error on bad credentials |
| **Authentication** | Password Reset | **PASSED** | Dispatches reset email via Firebase Auth `sendPasswordResetEmail` without leaking account existence |
| **Authentication** | Session Logout | **PASSED** | Clears session state and securely signs out from Firebase Auth |
| **Tenant Security** | Cross-tenant data isolation | **PASSED** | Company A cannot query or read Company B subcollection; enforced by Firestore security rules |
| **Tenant Security** | Role escalation prevention | **PASSED** | Ordinary users cannot set `role: super_admin`; rules restrict role assignment to bootstrapped admin |
| **Dashboard** | Super Admin authorized view | **PASSED** | Renders 5 KPI cards, searchable company list, account suspension toggle, and audit log trail |
| **Dashboard** | Company Admin tenant scoping | **PASSED** | Renders 5 KPI cards for active tenant, recent tenant activity, and links to profile/settings |
| **Dashboard** | Coming Soon placeholders | **PASSED** | Placeholders clearly labeled "Coming Soon in Phase 2" without displaying fake statistics |
| **Database** | Firestore Schema & Timestamps | **PASSED** | Documents write valid ISO timestamps, consistent IDs, and enforce Draft-07 JSON schema |
| **Database** | Security Rules Deployment | **PASSED** | Rules compiled and deployed to `ai-studio-504324bb-b5d2-4d9a-905d-960783ca1400` via Fax RPC |

---

## 9. HAPPIIZ HR – PHASE 2: SUPER ADMIN MASTER CONTROL & SAAS MANAGEMENT SYSTEM

Phase 2 establishes the complete central SaaS control tower for the platform owner to govern, bill, verify, and monitor hundreds or thousands of registered companies.

### 9.1 Phase 2 Deliverables Summary

1. **Master Dashboard & Executive Analytics**:
   - 12 verified live metrics: Total Registered Companies, Active Companies, Pending Approval, Suspended Companies, Trial Accounts, Expired/Grace Subscriptions, Total Workforce across tenants, Total Platform Users, Monthly Recurring Revenue (MRR in ₹), Total Collected Revenue, Pending Unpaid Invoices, and Upcoming Renewals within 15 days.
   - Date range selector (Today, This Week, This Month, Last Month, All Time).
   - 5 Real Interactive SVG Charts:
     - 1. Monthly Recurring Revenue Growth Trajectory
     - 2. Tenant Registration Rate
     - 3. Subscription Plan Distribution (Micro, Starter, Growth, Enterprise, Custom)
     - 4. Operational Status Breakdown (Active, Trial, Pending, Suspended)
     - 5. Workforce Scale across Sectors.

2. **Company Management Module**:
   - Comprehensive table columns: Company Name, Unique Tenant ID, Industry/Sector, Owner/Administrator, Contact Info, Registration Date, Workforce Headcount, Plan Tier, Account Status, and Actions.
   - Search by name, tenant ID, or administrator email.
   - Filters by sector, account status, and subscription tier.
   - Two-way sorting (Name, Date, Employees, Status) and pagination.
   - View Full Company Details modal with KYC and GSTIN records.
   - Edit Permitted Info modal (Contact, Address, GSTIN, licensed capacity).
   - Non-destructive Safe Archiving: Retains all historical legal and financial records while suspending runtime tenant access.

3. **Company Registration Approval Queue (KYC Workflow)**:
   - Dedicated review queue for onboarding companies.
   - Displays business type, owner name, official email, phone, physical address, optional GSTIN, and requested tier.
   - Actions: Verify & Approve (activates workspace, generates initial subscription), or Reject (with required justification notes).
   - All approval decisions recorded in the immutable audit log.

4. **Tenant Isolation & Resource Usage Monitoring**:
   - Scoped monitoring of tenant capacity: active workforce vs licensed limit, cloud storage used (MB/limit), monthly API calls, deployed client sites, and monthly attendance records.
   - Visual warning indicators when tenant approaches 80%+ plan capacity.
   - Administrator modal to adjust maximum licensed capacity limits.

5. **Subscription Plan Management**:
   - Dynamic plan management supporting:
     - **MICRO**: 1–25 employees, minimum flat ₹499/mo.
     - **STARTER**: 26–100 employees, ₹20 per employee per month (floor ₹520).
     - **GROWTH**: 101–500 employees, ₹15 per employee per month (floor ₹1,515).
     - **ENTERPRISE**: 501–2,000 employees, ₹12 per employee per month (floor ₹6,012).
     - **CUSTOM**: Above 2,000 employees, custom negotiated rate.
   - Create, edit, activate, deactivate, and archive subscription tiers.
   - Dynamic feature entitlements checklist and storage/API quota settings.

6. **Per-Employee SaaS Billing Engine**:
   - Algorithm implementation:
     `Monthly Subscription = Max(Minimum Monthly Fee, Billable Employees × Plan Rate)`
   - Billable employee rules: Field workforce on approved leave (`on_leave`) maintain active employment status and are counted as billable. Terminated/archived staff are non-billable.
   - Interactive Billing Simulator: Allows administrators to simulate headcounts (0–1,500), toggle monthly vs annual billing (with commitment discounts), and compute intra-state (9% CGST + 9% SGST) vs inter-state (18% IGST) taxes.
   - Historical Employee Count snapshots per billing cycle.

7. **Subscription Lifecycle & Automated Renewal Engine**:
   - Full lifecycle states: `trial`, `active`, `pending_payment`, `payment_failed`, `grace_period`, `expired`, `suspended`, `cancelled`.
   - Automated renewal urgency evaluator:
     - Renewal in 15 Days
     - Renewal in 7 Days
     - Renewal in 3 Days
     - Renewal Due Today
     - In 7-Day Grace Period
     - Expired
   - Administrative actions: change plan tier, extend renewal terms, apply promo discounts, adjust grace period.

8. **Payment Gateway & Reconciliation Ledger**:
   - Settlement ledger: Payment ID, Company, Invoice #, Base Amount, GST Tax, Total Amount, Remittance Method (UPI, Razorpay, Bank Transfer, Cheque, Cash), Payment Date, Transaction Reference.
   - Authorized manual payment recording with mandatory bank UTR proof reference.
   - Server-side webhook architecture documentation.

9. **Subscription Invoices & Tax Billing**:
   - Official GST tax invoice generator with Happiiz HR branding, invoice number, issue/due dates, customer GSTIN, workforce headcount line items, and CGST/SGST/IGST breakdown.
   - Printable / PDF export layout (window.print optimized stylesheet).
   - "Mark as Paid" reconciliation action.

10. **Platform Admin Team & RBAC Management**:
    - Roles:
      - `platform_owner`: Complete omnipotent platform administration (bootstrapped to `rexon.smc@gmail.com`).
      - `super_admin`: Multi-tenant operations, approvals, and platform administration.
      - `finance_admin`: Invoicing, payments, and revenue reports.
      - `verification_admin`: Company KYC review and registration approvals.
      - `support_admin`: Help desk and tenant troubleshooting.
      - `auditor`: Read-only access to audit trail and financial records.
    - Role assignment and permission revocation modal.

11. **Customer Support Help Desk**:
    - Central ticket board for managing support inquiries from security, housekeeping, and IFM tenants.
    - Ticket codes, priority levels (Low, Medium, High, Urgent), statuses (Open, In Progress, Waiting on Customer, Resolved, Closed), and admin resolution notes.

12. **Platform Global Settings**:
    - Configurable parameters: Platform Brand Name, Support Email/Phone, Default Currency (INR), Default Time Zone (Asia/Kolkata), Default Language (en), Require Approval toggle, Default Trial/Grace days, GST Tax Rate, Invoice Prefix and Sequence Counter, Maintenance Mode toggle.

13. **Platform Audit Trail**:
    - Immutable, write-once log of company approvals, plan modifications, status transitions, and role assignments. Searchable and filterable by category.

---

## 10. Phase 2 Verification & Testing Report

| Test Item | Verified Behavior | Status |
|---|---|---|
| **Super Admin Authentication** | Platform Owner (`rexon.smc@gmail.com`) automatically recognized as root administrator; unauthorized accounts blocked from master control | **PASSED** |
| **Executive Dashboard (12 KPIs)** | Renders exact 12 live metrics from verified data; date filters update interactive SVG charts | **PASSED** |
| **Company Directory Table** | Displays all required columns; search, filter, sort (name, date, employees, status), and pagination work seamlessly | **PASSED** |
| **Approval Workflow** | Pending company applications can be verified/approved with notes (activating workspace) or rejected with reason | **PASSED** |
| **Safe Archiving** | Non-destructive archiving restricts access while preserving all financial invoices, rosters, and audit trails | **PASSED** |
| **Tenant Limits & Usage** | Accurately calculates workforce % of limit; flags warning at 80%+; allows limit adjustment | **PASSED** |
| **Subscription Plan Manager** | Dynamic plans (Micro ₹499, Starter ₹20, Growth ₹15, Enterprise ₹12, Custom) can be created, edited, and toggled | **PASSED** |
| **Per-Employee Billing Engine** | Verifies `Max(MinFee, Headcount * Rate)`; on-leave employees billable; terminated staff excluded; GST computed | **PASSED** |
| **Renewal Monitoring** | Flags renewals at 15d, 7d, 3d, today, in-grace, and expired with countdown badges | **PASSED** |
| **GST Invoice Generation** | Generates official tax invoices with CGST/SGST/IGST breakdown; includes print/PDF layout | **PASSED** |
| **Payment Reconciliation** | Records manual settlements with UTR proof; transitions invoice status to paid; documents webhook flow | **PASSED** |
| **Admin Team RBAC** | Restricts role modifications to Platform Owner; enforces least-privilege delegation | **PASSED** |
| **Support Help Desk** | Tracks tenant tickets, priority levels, assignment, and resolution notes | **PASSED** |
| **Platform Settings** | Configures INR, Asia/Kolkata, KYC approval toggle, tax rates, and maintenance mode | **PASSED** |
| **Firestore Security Rules** | Rules updated for all Phase 2 paths and deployed via Fax RPC to Cloud Firestore | **PASSED** |
| **TypeScript & Build Check** | Clean compile (`npm run build` and `tsc --noEmit`) with 0 errors | **PASSED** |
