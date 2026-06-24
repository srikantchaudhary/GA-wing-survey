# User Requirement Specification (URS)

**Document Title:** User Requirement Specification — GAMIS Portal
**Project:** GA Wing Management Information System (GAMIS)
**Organisation:** Office of the Controller General of Accounts (CGA), Ministry of Finance
**Version:** 1.0
**Date:** June 2026
**Prepared By:** Development Team
**Classification:** Internal

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Project Scope](#2-project-scope)
3. [Definitions and Abbreviations](#3-definitions-and-abbreviations)
4. [System Overview](#4-system-overview)
5. [User Roles and Characteristics](#5-user-roles-and-characteristics)
6. [Functional Requirements](#6-functional-requirements)
   - 6.1 Authentication and User Management
   - 6.2 Admin — Dynamic Form Management
   - 6.3 Admin — Form Response Review and Approval
   - 6.4 Admin — Analytics Dashboard
   - 6.5 Admin — Static Forms Management
   - 6.6 Admin — Grievance Management
   - 6.7 Officer — Form Submission
   - 6.8 Officer — Static Data Entry
   - 6.9 Officer — Grievance Access
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Data Requirements](#8-data-requirements)
9. [Interface Requirements](#9-interface-requirements)
10. [Security Requirements](#10-security-requirements)
11. [System Constraints and Assumptions](#11-system-constraints-and-assumptions)
12. [Glossary](#12-glossary)

---

## 1. Introduction

### 1.1 Purpose

This document defines the user requirements for the **GA Wing Management Information System (GAMIS)** portal. It specifies what the system shall do from the perspective of its users — the Admin (CGA/GA Wing officers at headquarters) and State Officers (Accountant General offices across India). This document serves as the baseline for design, development, testing, and acceptance of the system.

### 1.2 Background

The GA Wing of the Office of the Controller General of Accounts (CGA) is responsible for conducting periodic IT systems access surveys across all Accountant General (AG) offices in India. Previously, survey data collection was manual (spreadsheets, emails), leading to inconsistencies, delays, and difficulty in aggregation. GAMIS replaces this with a centralised web-based portal.

### 1.3 Document Scope

This URS covers all features of the GAMIS portal including:
- User authentication and access control
- Dynamic survey form creation and publishing by administrators
- Survey form filling and submission by state officers
- Response review, approval, and rejection workflow
- Analytics and reporting
- Static data management (DA Nominations, MCA/MKI records)
- Grievance management

---

## 2. Project Scope

### 2.1 In Scope

| Area | Description |
|------|-------------|
| User Management | Registration, login, password reset, role-based access |
| Dynamic Forms | Admin creates, publishes, and manages IT access survey forms |
| Survey Submission | State officers fill and submit forms assigned to their state |
| Approval Workflow | Admin approves or rejects individual response records |
| Reporting | Admin views aggregated responses, exports data |
| Static Forms | DA Cadre nominations and MCA/MKI date records |
| Grievances | Admin creates grievances; officers view state-specific grievances |
| Notifications | OTP via email for password reset |

### 2.2 Out of Scope

- Integration with external government systems (IFMIS, e-HRMS, WAMIS, e-Voucher portals directly)
- SMS notifications
- Mobile application
- Offline form filling
- Automated report distribution via email

---

## 3. Definitions and Abbreviations

| Term | Definition |
|------|------------|
| GAMIS | GA Wing Management Information System |
| CGA | Controller General of Accounts |
| GA Wing | Government Accounting Wing under CGA |
| AG Office | Accountant General Office — state-level accounting authority |
| Admin | Headquarters-level user with full system access |
| Officer | State-level user representing an AG office |
| Form | A configurable survey questionnaire created by the admin |
| Section | A logical grouping of fields within a form (e.g. IFMIS, e-HRMS) |
| Custom Section | An admin-defined section added dynamically outside standard annexures |
| Response | A submitted set of answers to a form by a state officer |
| Draft | An auto-saved partial response not yet submitted |
| Approval Status | Per-record status: Pending / Approved / Rejected |
| IFMIS | Integrated Financial Management Information System |
| e-HRMS | Electronic Human Resource Management System |
| WAMIS | Works Accounting Management Information System |
| DA | Departmental Accounting |
| MCA | Monthly Close of Accounts |
| MKI | Monthly Key Indicators |
| OTP | One-Time Password |
| JWT | JSON Web Token — used for authenticated sessions |

---

## 4. System Overview

### 4.1 System Description

GAMIS is a full-stack web application consisting of:

- **Frontend:** React 19 single-page application with role-specific portals (Admin and Officer)
- **Backend:** Node.js / Express.js REST API
- **Database:** MySQL 8.0 relational database
- **Authentication:** JWT-based sessions stored in HttpOnly cookies
- **Email Service:** Gmail SMTP via Nodemailer (for OTP delivery)

### 4.2 High-Level Architecture

```
Browser (Officer/Admin)
        │
        ▼
  React Frontend (Vite)  ←─── Tailwind CSS, React Router
        │  REST API calls
        ▼
  Express.js Backend  ───── JWT Middleware, Role Guards
        │
        ▼
  MySQL Database  ────── users, forms, responses, drafts,
                          custom_sections, nominations,
                          mca_mki_records, grievances
```

### 4.3 Deployment Environment

| Component | Detail |
|-----------|--------|
| Frontend Port | 5173 (development), served as static build in production |
| Backend Port | 3001 |
| Database | MySQL on 127.0.0.1:3306 |
| Email | Gmail SMTP with App Password |

---

## 5. User Roles and Characteristics

### 5.1 Admin (Headquarters Officer)

| Attribute | Description |
|-----------|-------------|
| Who | CGA / GA Wing officers at headquarters level |
| Access | Full access to all states, all forms, all responses |
| Primary Tasks | Create and publish forms, review and approve responses, manage grievances, view analytics |
| Technical Level | Moderate — comfortable with web-based government systems |
| Frequency of Use | Daily to weekly during survey collection periods |

### 5.2 State Officer (AG Office Officer)

| Attribute | Description |
|-----------|-------------|
| Who | Officers at Accountant General offices across India |
| Access | Restricted to forms assigned to their state |
| Primary Tasks | Fill and submit survey forms, manage DA nominations and MCA/MKI dates |
| Technical Level | Basic to moderate |
| Frequency of Use | Periodic — typically once per survey cycle |

---

## 6. Functional Requirements

---

### 6.1 Authentication and User Management

#### REQ-AUTH-01: User Registration

The system shall allow a new user to register by providing:
- Full name
- Email address (must be unique)
- Password (minimum 6 characters)
- Role selection: Admin or Officer
- State assignment: mandatory for Officers, applicable for Admins

On successful registration the system shall store the user and confirm registration.

#### REQ-AUTH-02: User Login

The system shall authenticate users with email and password. On successful login:
- A JWT token shall be issued and stored in an HttpOnly cookie (24-hour expiry)
- The user shall be redirected to their role-specific portal (Admin or Officer)

On failed login the system shall display an appropriate error message without revealing whether the email or password was incorrect.

#### REQ-AUTH-03: Password Reset via OTP

The system shall provide a multi-step forgot password flow:
1. User enters registered email address
2. System generates a 6-digit OTP, hashes it (bcrypt), stores it with a 15-minute expiry, and sends it to the registered email via SMTP
3. The OTP shall never be displayed on screen
4. User enters the OTP received in email
5. User sets a new password (minimum 6 characters)
6. System updates the password and clears the OTP

#### REQ-AUTH-04: Role-Based Portal Routing

- Users with role Admin shall be directed to the Admin portal at `/admin`
- Users with role Officer shall be directed to the Officer portal at `/officer/:state`
- Officers without a state assigned shall be redirected to login

#### REQ-AUTH-05: Session Persistence and Logout

- Sessions shall persist for 24 hours via JWT cookie
- Logout shall clear the cookie and invalidate the local session
- Cross-tab logout shall be synchronised via browser storage events

---

### 6.2 Admin — Dynamic Form Management

#### REQ-FORM-01: Form Creation

The admin shall be able to create a new survey form with the following attributes:
- Form name
- Survey year (e.g. 2025-26)
- Description (optional)
- Selection of one or more standard sections: IFMIS, e-HRMS, WAMIS, e-Voucher
- Selection of one or more custom sections (if created)
- Assignment to one or more states

A unique Form ID shall be auto-generated for each form (format: `GAW-NEW-{timestamp}`).

#### REQ-FORM-02: Standard Survey Sections

The system shall support the following built-in survey sections with predefined fields:

| Section | Annexure | Fields |
|---------|----------|--------|
| IFMIS | Annexure I | State, IFMIS Access Available (Yes/No/Partial), Nature/Remarks, Audit Action |
| e-HRMS | Annexure III | e-HRMS Implemented, A&E Access Level, Nature of Access, Audit Action |
| WAMIS | Annexure IV | WAMIS Status, A&E Access, Nature of Data |
| e-Voucher | Annexure V | Voucher Status, Type Prevalent, System/Portal, DSC Status, DSC Remarks |

#### REQ-FORM-03: Custom Section Creation

The admin shall be able to create custom sections via a 3-step wizard:

**Step 1 — Name and Colour**
- Enter section name
- Select colour theme from 8 preset options

**Step 2 — Number of Columns**
- Select number of columns (fields) for this section

**Step 3 — Column Details**
For each column:
- Column name (text)
- Data type: Text, Number, Date, Dropdown, Checkbox
- Required toggle: if enabled, officer must fill this field before submitting
- For Dropdown/Checkbox types: option list entry

A live preview of each field shall be shown while configuring.

#### REQ-FORM-04: Form Workflow States

Each form shall progress through the following states:

| State | Description |
|-------|-------------|
| Draft | Being configured by admin; not visible to officers |
| Review | Admin marks for review before publish |
| Published | Visible and fillable by assigned state officers |

Only forms in Draft or Review status may be deleted. Published forms cannot be deleted.

#### REQ-FORM-05: Form Deletion with Confirmation

When admin clicks delete on a Draft or Review form, a full-screen confirmation modal shall appear showing:
- Form name (prominently displayed)
- Form ID
- Warning that deletion is permanent and cannot be undone
- The form name shall appear twice (once in a card, once in the confirmation sentence) to ensure the admin consciously acknowledges which form is being deleted
- Buttons: Cancel and "Yes, Delete Form"

Published forms shall show the delete button as disabled with a tooltip: "Published forms cannot be deleted".

#### REQ-FORM-06: Form Publishing

Admin shall be able to publish a form to specific states. Once published:
- The form becomes visible to officers of the assigned states
- State assignment uses a multi-state selector with inline keyword search

#### REQ-FORM-07: Form Sidebar with Search and Filter

The admin sidebar shall list all forms with:
- Keyword search (by form name or ID)
- Filter tabs: All, Published, Draft, Review
- Count badges per tab
- Per-form status indicator (colour-coded badge)
- Delete button (enabled only for Draft/Review)

---

### 6.3 Admin — Form Response Review and Approval

#### REQ-RESP-01: Response List View

The admin shall be able to view all submitted responses for a selected form, with:
- Filter by state (searchable dropdown)
- Filter by approval status: All / Pending / Approved / Rejected
- Summary badges showing total counts per status
- Columns: State, Officer Name, Designation, Office, Submitted On, Status, and all form-specific section fields

#### REQ-RESP-02: Record-Level Approval

The admin shall be able to approve or reject individual response records. Approval is at the **record level** (not the state level).

- Admin can select one or multiple records using checkboxes
- Selecting records enables "Approve Selected" and "Reject Selected" action buttons
- On action, the approval status of selected records shall be updated immediately
- The UI shall reflect the updated status without a full page reload

#### REQ-RESP-03: Approval Status Badges

Each response record shall display an approval status badge:
- ⏳ Pending (amber)
- ✅ Approved (green)
- ❌ Rejected (red)

#### REQ-RESP-04: Approved Record Lock

Once a record is approved, the corresponding officer shall not be able to edit that record. Rejected records remain editable by the officer.

---

### 6.4 Admin — Analytics Dashboard

#### REQ-DASH-01: Response Overview

The dashboard shall display:
- Total forms created
- Total responses submitted
- State-wise submission status
- Per-form submission counts

#### REQ-DASH-02: Export

The admin shall be able to export response data to Excel (XLSX) and PDF formats.

---

### 6.5 Admin — Static Forms Management

#### REQ-STATIC-01: DA Cadre Nominations

The admin shall be able to manage DA Cadre nomination records with:
- Employee name
- Designation
- Email address
- Mobile number
- State
- Create, edit, and delete operations

#### REQ-STATIC-02: MCA/MKI Records

The admin shall be able to manage MCA (Monthly Close of Accounts) and MKI (Monthly Key Indicators) date records per state, including:
- Due date
- Allocation date
- Comments
- Create, edit, and delete operations

---

### 6.6 Admin — Grievance Management

#### REQ-GRIEV-01: Create Grievance

Admin shall be able to create a grievance record with:
- Grievance name / title
- Type
- Reason / description
- State(s) assignment (multi-select)
- File attachment (document, image, PDF)

#### REQ-GRIEV-02: Edit and Delete Grievance

Admin shall be able to edit all fields of an existing grievance including replacing the attachment. Admin shall be able to delete a grievance.

#### REQ-GRIEV-03: Grievance Visibility

Officers shall view only grievances assigned to their state. Admin views all grievances.

---

### 6.7 Officer — Form Submission

#### REQ-OFF-01: Form List

On login, the officer shall see:
- **Pending Forms** panel: forms assigned to their state that have not yet been submitted
- **Submitted Forms** sidebar: forms already submitted, accessible for review and re-editing

#### REQ-OFF-02: Form Navigation

Within a form, the officer shall see a left-side navigation panel with:
- Form name and ID
- Fill progress bar (Overall %)
- Required fields completion tracker (n/total)
- Jump-to links for each section
- Draft auto-save timestamp

#### REQ-OFF-03: Field Types

The system shall support the following field types in forms:

| Type | Behaviour |
|------|-----------|
| Text | Free-text single line input |
| Number | Numeric input; disallows e, E, +, – keys |
| Date | Date picker; capped at today's date |
| Email | Text input with email format validation |
| Phone (tel) | Shows fixed +91 prefix; accepts 10-digit number only |
| Dropdown | Single select from predefined options |
| Radio | Single select from inline pill options |
| Checkbox | Multi-select from inline pill options |
| Textarea | Multi-line text; 1000 character limit with counter |

#### REQ-OFF-04: Required Field Enforcement

Fields marked as required (both built-in and custom section fields) shall:
- Show a red asterisk (*) next to the field label
- Block form submission if left empty
- Display an inline error message below the field on failed validation

#### REQ-OFF-05: Field Validation Rules

| Field | Validation Rule |
|-------|----------------|
| Officer Name | Letters and spaces only; must start with a letter; no digits or special characters |
| Email Address | Must match format: `local@domain.tld` with 2+ character TLD |
| Phone / Extension | Exactly 10 digits; must start with 6, 7, 8, or 9 (Indian mobile); +91 prefix is fixed and non-editable |
| Required fields | Must not be empty (or blank array for checkboxes) |
| Date | Must be a valid date; submission date is locked to current date and non-editable |
| Office / A&E Branch | Auto-filled as `AG {State}` and non-editable |

#### REQ-OFF-06: Draft Auto-Save

While filling a form, the system shall auto-save the current form data as a draft 1.5 seconds after the officer stops typing. The last saved timestamp shall be shown in the left panel. Drafts are stored per state+form combination.

#### REQ-OFF-07: Form Submission

On clicking "Submit Form":
1. All validations run
2. If valid, the response is saved to the database with status Pending
3. A full-screen success overlay appears showing a Submission Receipt (form name, form ID, state, survey year, submitted date)
4. Clicking "View Response →" on the overlay navigates to the Form Response page showing the submitted record

#### REQ-OFF-08: Form Response Page

After submission, the officer shall see a tabular response page with:
- All submitted records for that form
- Per-record status badge (Pending / Approved / Rejected)
- Edit button (disabled if the record is Approved)
- View button (opens a detail modal)
- Add New Record button for additional submissions
- Status banner (All Approved / Partially Approved / Some Rejected)

#### REQ-OFF-09: Adding New Records

Officers shall be able to add multiple response records for the same form. The "+ Add Response" button in the page header shall open a blank form. The empty-state card shall not show a duplicate button — only the header button is active.

#### REQ-OFF-10: Edit Existing Record

Officers shall be able to edit a submitted record unless it has been approved by admin. Editing opens the same form pre-filled with the existing data.

---

### 6.8 Officer — Static Data Entry

#### REQ-STATIC-OFF-01: DA Nomination Entry

Officers shall be able to create and manage DA Cadre nomination entries for their state.

#### REQ-STATIC-OFF-02: MCA/MKI Date Entry

Officers shall be able to create and manage MCA/MKI date records for their state.

---

### 6.9 Officer — Grievance Access

Officers shall view grievances assigned to their state. Officers cannot create or delete grievances.

---

## 7. Non-Functional Requirements

### 7.1 Performance

| ID | Requirement |
|----|-------------|
| NFR-PERF-01 | Page load time shall be under 3 seconds on a standard broadband connection |
| NFR-PERF-02 | Form draft auto-save shall complete within 2 seconds of triggering |
| NFR-PERF-03 | Response list shall load within 3 seconds for up to 500 records |
| NFR-PERF-04 | The system shall support at least 50 concurrent officer sessions |

### 7.2 Usability

| ID | Requirement |
|----|-------------|
| NFR-USE-01 | All forms shall display inline validation errors immediately on submission attempt |
| NFR-USE-02 | The system shall use consistent colour coding: blue = admin/neutral, green = success/approved, amber = pending/draft, red = error/rejected |
| NFR-USE-03 | All destructive actions (delete) shall require a named confirmation modal |
| NFR-USE-04 | Toast notifications shall appear for all major actions (save, submit, delete, approve) |
| NFR-USE-05 | The system shall be fully usable in current versions of Chrome, Firefox, and Edge |

### 7.3 Reliability

| ID | Requirement |
|----|-------------|
| NFR-REL-01 | The system shall preserve draft data in the database; no data loss on browser close |
| NFR-REL-02 | Failed API calls shall display user-friendly error messages |
| NFR-REL-03 | Email delivery failure for OTP shall return a clear error and not expose the OTP |

### 7.4 Maintainability

| ID | Requirement |
|----|-------------|
| NFR-MNT-01 | Database migrations shall be idempotent and runnable safely multiple times |
| NFR-MNT-02 | Form schema (field definitions, sections) shall be defined in a single source-of-truth file (`formSchema.js`) |
| NFR-MNT-03 | Custom sections shall be stored as JSON in the database to allow schema evolution |

### 7.5 Scalability

| ID | Requirement |
|----|-------------|
| NFR-SCA-01 | The system shall support all 36 Indian states and Union Territories |
| NFR-SCA-02 | Admins shall be able to create unlimited survey forms |
| NFR-SCA-03 | Each form shall support an unlimited number of response records per state |

---

## 8. Data Requirements

### 8.1 Core Data Entities

| Entity | Key Attributes |
|--------|----------------|
| User | ID, name, email, state, role, password hash, OTP fields |
| Form | ID, form_id, name, sections (JSON), states (JSON), status, survey year, description |
| Response | ID, form_id, state, survey_year, data (JSON), approval_status, approved_by, approved_at |
| Draft Response | state, form_id, data (JSON), timestamps |
| Custom Section | ID, payload (JSON: label, colour, columns with types and options) |
| DA Nomination | ID, state, employee name, designation, email, mobile |
| MCA/MKI Record | ID, state, MCA dates, MKI dates, comments |
| Grievance | ID, states (JSON), name, type, reason, file attachment metadata |

### 8.2 Data Integrity Rules

- Response `approval_status` shall only accept values: `pending`, `approved`, `rejected`
- `approved_by` shall store user IDs as BIGINT (timestamp-based 13-digit IDs)
- Form deletion is blocked if status is `published`
- Draft data is cleared after successful form submission
- OTP stored as bcrypt hash (rounds=8); plain OTP never persisted

### 8.3 Data Retention

- Drafts shall be retained until the officer submits the form or explicitly clears them
- Deleted forms shall be permanently removed from the database
- Approved responses shall be retained indefinitely

---

## 9. Interface Requirements

### 9.1 User Interface

| Requirement | Description |
|-------------|-------------|
| UI-01 | The portal shall use GAMIS branding with a GA monogram logo |
| UI-02 | Admin portal shall have a persistent left sidebar with form list and a main content area |
| UI-03 | Officer portal shall have a navigation sidebar with sections: Pending Forms, Static Forms, Reports, Grievances |
| UI-04 | All modals (create, confirm delete, success) shall use a full-screen dimmed overlay |
| UI-05 | State selection components shall support inline keyword search (type to filter) |
| UI-06 | All tables shall be horizontally scrollable for wide datasets |

### 9.2 API Interface

All communication between frontend and backend shall use REST over HTTP with JSON payloads. Base URL: `/api`.

| Module | Base Path |
|--------|-----------|
| Authentication | `/api/auth` |
| Forms | `/api/forms` |
| Responses | `/api/responses` |
| Drafts | `/api/drafts` |
| Custom Sections | `/api/custom-sections` |
| Nominations | `/api/nominations` |
| MCA/MKI | `/api/mca-mki` |
| Grievances | `/api/grievances` |
| Reference Data | `/api/states`, `/api/designations` |

### 9.3 Email Interface

The system shall use Gmail SMTP (configured via environment variables) to deliver OTP emails. The email shall include:
- GAMIS branding header
- 6-digit OTP in large, clear monospace font
- 15-minute validity notice
- Disclaimer that the email should be ignored if not requested

---

## 10. Security Requirements

| ID | Requirement |
|----|-------------|
| SEC-01 | Passwords shall be hashed using bcrypt with a minimum of 10 rounds before storage |
| SEC-02 | JWT tokens shall be stored in HttpOnly cookies to prevent XSS access |
| SEC-03 | All protected API routes shall validate the JWT token on every request |
| SEC-04 | Officers shall only be able to access, create, and modify data for their own assigned state |
| SEC-05 | Admin-only endpoints (form creation, publishing, approval) shall reject Officer tokens with HTTP 403 |
| SEC-06 | OTPs shall be hashed with bcrypt (rounds=8) before storage; raw OTP shall never appear in API responses or logs |
| SEC-07 | OTPs shall expire after 15 minutes; expired OTPs shall be rejected |
| SEC-08 | The system shall not reveal whether an email is registered during the forgot-password flow (anti-enumeration) |
| SEC-09 | File uploads for grievances shall be limited by file type and size via Multer middleware |
| SEC-10 | Database queries shall use parameterised statements (mysql2) to prevent SQL injection |

---

## 11. System Constraints and Assumptions

### 11.1 Constraints

| Constraint | Description |
|------------|-------------|
| CON-01 | The system requires a MySQL 8.0 or above database |
| CON-02 | Email OTP delivery depends on Gmail SMTP availability and correct App Password configuration |
| CON-03 | Officers must have a state assigned at the time of registration; state cannot be changed post-registration via the portal |
| CON-04 | Published forms cannot be deleted; the admin must manage form lifecycle carefully before publishing |
| CON-05 | The system is web-only; no native mobile application is in scope |

### 11.2 Assumptions

| Assumption | Description |
|------------|-------------|
| ASM-01 | Each AG office has at least one designated officer registered in the system |
| ASM-02 | Admins are trusted users; no approval workflow is required for admin actions |
| ASM-03 | Each state is assigned to exactly one officer account per form submission cycle |
| ASM-04 | Survey years are manually entered (no automatic calculation from system date) |
| ASM-05 | Internet connectivity is available at all AG offices during survey periods |
| ASM-06 | The Gmail account used for SMTP has 2FA enabled and an App Password generated |

---

## 12. Glossary

| Term | Definition |
|------|------------|
| Annexure | A numbered section of the IT systems survey (I, III, IV, V correspond to IFMIS, e-HRMS, WAMIS, e-Voucher respectively) |
| Draft | A partially completed form saved automatically, not yet submitted |
| Dynamic Form | A survey form configured by admin with a selected combination of sections and custom fields |
| Form ID | System-generated unique identifier for a form, format: `GAW-NEW-{timestamp}` |
| HttpOnly Cookie | A browser cookie inaccessible to JavaScript, used for secure JWT storage |
| OTP | One-Time Password — 6-digit numeric code valid for 15 minutes, used for password reset |
| Pending Status | Default approval state for a newly submitted response record |
| Published Form | A form in active state, visible and fillable by assigned state officers |
| Record-Level Approval | The ability for admin to approve or reject individual response entries within a form, as opposed to approving all responses for a state at once |
| Required Field | A form field that the officer must fill before submission; marked with a red asterisk (*) |
| State Officer | A user registered with role Officer and an assigned Indian state or UT |
| Survey Year | The fiscal year for which the IT systems access survey is being conducted (e.g. 2025-26) |

---

*End of User Requirement Specification*

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | June 2026 | Development Team | Initial release |
