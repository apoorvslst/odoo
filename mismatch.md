# Frontend ↔ Backend Mismatch Report & Fix Log

## Status: 🔧 IN PROGRESS

---

## 1. AUTHENTICATION MISMATCHES (CRITICAL — FIXED)

### 1.1 AdminLogin.jsx
| Aspect | Om's Frontend (BEFORE) | Gaurav's Backend (TRUTH) | Fix |
|---|---|---|---|
| **Endpoint** | `POST /api/v1/auth/admin/login` | `POST /api/auth/login` (unified) | ✅ Changed URL |
| **Field: username** | Sends `loginId` | Expects `email` | ✅ Changed to `email` |
| **Response shape** | Expects `{ success, redirectUrl, token, user }` | Returns `{ token, user: { id, username, email, role, contactId, createdAt } }` | ✅ Adapted |
| **Role check** | None | Backend has roles `admin`, `accountant`, `contact` | ✅ Added client-side role gate |

### 1.2 ConsumerLogin.jsx
| Aspect | Om's Frontend (BEFORE) | Gaurav's Backend (TRUTH) | Fix |
|---|---|---|---|
| **Endpoint** | `POST /api/v1/auth/consumer/login` | `POST /api/auth/login` (same unified) | ✅ Changed URL |
| **Field** | Sends `loginId` | Expects `email` | ✅ Changed |
| **Response** | Expects `{ success, redirectUrl }` | Returns `{ token, user }` | ✅ Adapted |

### 1.3 SignUp.jsx
| Aspect | Om's Frontend (BEFORE) | Gaurav's Backend (TRUTH) | Fix |
|---|---|---|---|
| **Endpoint** | `POST /api/v1/auth/signup` | `POST /api/auth/register` | ✅ Changed URL |
| **Fields sent** | `{ loginId, email, password, role }` | Expects `{ username, email, password }` | ✅ Mapped loginId→username, removed role |

### 1.4 Login.jsx (Generic)
| Aspect | Om's Frontend (BEFORE) | Gaurav's Backend (TRUTH) | Fix |
|---|---|---|---|
| **Endpoint** | `POST /api/v1/auth/login` | `POST /api/auth/login` | ✅ Changed URL |
| **Fields** | Sends `loginId` | Expects `email` | ✅ Changed |

---

## 2. CONTACTS MASTER MISMATCHES (FIXED)

### 2.1 Field Name Mismatches
| Frontend Field (Om) | Backend Column | Backend JSON key | Fix |
|---|---|---|---|
| `phone` | `mobile` | `mobile` | ✅ Renamed |
| `street` | ❌ Not in schema | — | ✅ Removed |
| `country` | ❌ Not in schema | — | ✅ Removed |
| `image` | `profile_image` | `profileImage` | ✅ Renamed |
| ❌ Missing | `type` (required) | `type` | ✅ Added selector |

### 2.2 API Wiring
| Action | Before | After |
|---|---|---|
| List | Local useState | `GET /api/contacts` |
| Create | Local push | `POST /api/contacts` |
| Update | Local map | `PUT /api/contacts/:id` |
| Delete | None | `DELETE /api/contacts/:id` |
| Archive | None | `PATCH /api/contacts/:id/archive` |

---

## 3. PRODUCTS MASTER MISMATCHES (FIXED)

### 3.1 Field Name Mismatches
| Frontend Field (Om) | Backend JSON key | Fix |
|---|---|---|
| `cost` | `purchaseCost` | ✅ Renamed |
| `vendorPrice` | ❌ Not in schema | ✅ Removed from payloads |
| `type` values `'Goods'` | `'goods'` (lowercase) | ✅ Lowercased |
| ❌ Missing `quantityOnHand` | `quantityOnHand` | ✅ Displayed |

---

## 4. VITE PROXY (FIXED)
- Added proxy `/api` → `http://localhost:3000` in vite.config.js

## 5. PAGINATION (ADDED)
- `ContactListView`, `ContactKanbanView`, `ProductListView`, `ProductKanbanView` — 20 items/page
- `CustomerDashboard` Invoices table — 10 items/page with Previous/Next controls
- `VendorDashboard` Bills table — 10 items/page with Previous/Next controls

## 6. AUTH TOKEN & PROFILE UI (ADDED)
- localStorage token storage + Authorization header on all API calls
- Persistent `user` session in `App.jsx`
- Header Profile Avatar & Name with direct Dashboard shortcut and Logout action
- Role-aware redirect:
  - Admin/Accountant &rarr; `AdminDashboard`
  - Contact (customer) &rarr; `CustomerDashboard`
  - Contact (vendor) &rarr; `VendorDashboard`

## 7. FINANCIAL CHAINING IN CONTACT MASTER (ADDED)
- `Invoices Attached` column in `ContactListView`: shows count + total amount
- `Payments Recorded` column in `ContactListView`: shows count + total cleared payments
- `ContactFormView`: Tabbed drill-down showing all linked invoice documents and payment receipts attached to the contact

## 8. REMAINING (NOT YET WIRED)
| Module | Route | Frontend Status |
|---|---|---|
| Accounts | `/api/accounts` | Placeholder tab |
| Orders | `/api/orders` | Placeholder tab |
| Reports | `/api/reports` | Placeholder tab |

## 9. VARIABLE CHEATSHEET
| Context | Frontend → Backend |
|---|---|
| Auth login | `email` → `email` |
| Auth register | `username` → `username` |
| Contact phone | `mobile` → `mobile` |
| Contact image | `profileImage` → `profileImage` |
| Product cost | `purchaseCost` → `purchaseCost` |
| Product types | lowercase only |
| Contact types | `customer`/`vendor`/`both` |
| Roles | `admin`/`accountant`/`contact` |
