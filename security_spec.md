# Happiiz HR – Security Specification & Audit Guide

## 1. Data Invariants & Zero-Trust Tenant Isolation

1. **Global Default-Deny**: All documents in all paths are denied by default (`match /{document=**} { allow read, write: if false; }`).
2. **Super Admin Authorization**: Super admin privilege is checked using the trusted document lookup or bootstrapped admin verification against user email `rexon.smc@gmail.com`.
3. **Tenant Boundary Invariant**:
   - Every company is uniquely identified by `companyId`.
   - All tenant sub-resources (employees, client sites, rosters) reside in `/companies/{companyId}/*`.
   - Access to `/companies/{companyId}` and its sub-resources requires either Super Admin privilege or matching verified Company Admin identity (`companyId == user.companyId` and `user.role == 'company_admin'`).
   - No company admin or employee can read, query, list, or write another tenant's sub-collection.
4. **Immutability of System & Auditing Fields**:
   - `id`, `tenantId`, `createdAt`, and `actorUid` can never be mutated during an update.
   - Audit logs are append-only; updates and deletions are strictly denied.
5. **No Blind Client-Delegated Queries**:
   - All `list` operations enforce relational ownership or company scoping against `resource.data` to prevent database-scraping or query enumeration attacks.

---

## 2. The "Dirty Dozen" Security Attack Payloads

The following 12 attack vectors are blocked by our Firestore rules and schema validation:

1. **Cross-Tenant ID Injection**:
   - Tenant A attempts to read or write to `/companies/tenant_b_456/employees/emp_001`.
   - *Result*: `PERMISSION_DENIED` (Tenant isolation gate failure).
2. **Self-Promoted Super Admin Privilege Escalation**:
   - Unprivileged user sets `"role": "super_admin"` in `/users/{userId}`.
   - *Result*: `PERMISSION_DENIED` (Restricted role field mutation).
3. **ID Poisoning / Denial of Wallet Attack**:
   - Attacker attempts to create a document with an ID of 1,000 characters or containing path traversal characters: `/companies/../../etc/passwd`.
   - *Result*: `PERMISSION_DENIED` (Regex & max length 128 check via `isValidId()`).
4. **Shadow Field Attack**:
   - Client sends extra unauthorized payload fields e.g. `{"isAdmin": true, "bypassBilling": true}` during company update.
   - *Result*: `PERMISSION_DENIED` (`affectedKeys().hasOnly(...)` gate check).
5. **Immutability Bypass Attack**:
   - Attacker attempts to change `createdAt` timestamp or `tenantId` on an existing company.
   - *Result*: `PERMISSION_DENIED` (`incoming().createdAt == existing().createdAt` invariance).
6. **Audit Trail Tampering**:
   - Attacker sends an `update` or `delete` request to `/audit_logs/{logId}`.
   - *Result*: `PERMISSION_DENIED` (Audit logs are strictly write-only, no update/delete).
7. **Orphaned Employee Insertion**:
   - Attacker attempts to create an employee record under a non-existent company ID.
   - *Result*: `PERMISSION_DENIED` (Parent company check).
8. **Unverified Email Impersonation**:
   - Attacker attempts administrative actions using an unverified account claiming an admin email.
   - *Result*: `PERMISSION_DENIED` (`request.auth.token.email_verified == true` requirement).
9. **Employee Count / Capacity Tampering**:
   - Regular company user attempts to bump `maxEmployees` license limit.
   - *Result*: `PERMISSION_DENIED` (Subscription & limits restricted to Super Admin).
10. **Unauthenticated Public Document Snooping**:
    - Anonymous or unauthorized request attempts `get` or `list` on `/users` or `/companies`.
    - *Result*: `PERMISSION_DENIED` (`isSignedIn()` check fails).
11. **Client List Scraper Injection**:
    - Client attempts to run an unbounded `getDocs(collection(db, 'companies'))` without Super Admin credentials.
    - *Result*: `PERMISSION_DENIED` (Rule enforces Super Admin for multi-tenant listing).
12. **Malformed Type Attack**:
    - Attacker writes string payload `"monthlyFee": "FREE_NO_CHARGE"` instead of a positive number.
    - *Result*: `PERMISSION_DENIED` (`isValidCompany` type check).

---

## 3. Security Test Runner Specification
Tests verify that all Dirty Dozen operations return `PERMISSION_DENIED` against the deployed `firestore.rules`.
