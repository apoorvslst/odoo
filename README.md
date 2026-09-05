# AccountanT++

AccountanT++ is a comprehensive, modern accounting and financial management system designed to streamline business operations, from tracking transactions to generating insightful financial reports.

## Features
- **User Authentication:** Secure login and role-based access control.
- **Dashboard:** At-a-glance financial overview with interactive charts and graphs.
- **Chart of Accounts:** Manage Assets, Liabilities, Equity, Revenue, and Expenses.
- **Journal Entries:** Robust double-entry bookkeeping system.
- **Invoicing & Billing:** Generate and track invoices and bills.
- **Contact Management:** Maintain records of customers and vendors.
- **Reporting:** Generate Profit & Loss, Balance Sheet, and Cash Flow statements.

## Database Tables (Schema Overview)

Based on the system architecture and standard accounting practices, here are the primary tables required for AccountanT++:

### 1. Users
Stores user credentials and roles.
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID/INT | Primary Key |
| `username` | VARCHAR | User's display name |
| `email` | VARCHAR | User's email address |
| `password_hash` | VARCHAR | Encrypted password |
| `role` | VARCHAR | e.g., Admin, Accountant, Viewer |
| `created_at` | TIMESTAMP | Account creation date |

### 2. Accounts (Chart of Accounts)
Stores the financial accounts for the organization.
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID/INT | Primary Key |
| `account_code`| VARCHAR | Unique account number (e.g., 1000) |
| `account_name`| VARCHAR | Name (e.g., Cash, Accounts Receivable) |
| `type` | VARCHAR | Asset, Liability, Equity, Revenue, Expense |
| `balance` | DECIMAL | Current balance of the account |

### 3. Transactions (Journal Entries)
Records the high-level transaction details.
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID/INT | Primary Key |
| `date` | DATE | Date of the transaction |
| `description` | TEXT | Description/Memo |
| `reference` | VARCHAR | Receipt or invoice number |
| `created_by` | UUID/INT | Foreign Key to Users table |

### 4. Transaction Lines (Ledger Entries)
Records the debit and credit lines for each transaction (Double-entry).
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID/INT | Primary Key |
| `transaction_id`| UUID/INT | Foreign Key to Transactions table |
| `account_id` | UUID/INT | Foreign Key to Accounts table |
| `debit` | DECIMAL | Debit amount |
| `credit` | DECIMAL | Credit amount |

### 5. Contacts (Customers & Vendors)
Stores information about people or companies you do business with.
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID/INT | Primary Key |
| `name` | VARCHAR | Company or individual name |
| `type` | VARCHAR | Customer or Vendor |
| `email` | VARCHAR | Contact email |
| `phone` | VARCHAR | Contact phone number |

### 6. Invoices / Bills
Records sales to customers or purchases from vendors.
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID/INT | Primary Key |
| `contact_id` | UUID/INT | Foreign Key to Contacts table |
| `date` | DATE | Issue date |
| `due_date` | DATE | Payment due date |
| `total_amount`| DECIMAL | Total amount of the invoice/bill |
| `status` | VARCHAR | Draft, Sent, Paid, Overdue |

*(Note: The exact schema may vary depending on the specific ORM or database constraints used in the final implementation. Due to the high compression of the provided image, these tables represent the standard foundational architecture for a complex accounting flow like the one shown).*

## Getting Started

### Prerequisites
- Docker
- PostgreSQL (via Docker)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/apoorvslst/odoo.git
   cd odoo
   ```
2. Start the database using Docker:
   ```bash
   docker run --name accountant-db -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=accountant_plus_plus -p 5432:5432 -d postgres
   ```
3. Run the application (Instructions to be added based on the backend framework).

## License
[MIT License](LICENSE)
