
# PerfectPOS - TODO & Future Development

This document lists features that are currently placeholders, partially implemented, or represent future work required to enhance the PerfectPOS system into a fully production-grade application.

## I. Major Features & Systems to Implement/Complete

1.  **User Roles & Permissions (Full Implementation)**:
    *   **Admin User Management UI**: Admins need a UI (e.g., `/settings/users`) to invite/add new users (cashiers, managers) to their store, assign/change roles, and deactivate accounts.
    *   **Modify Registration**: Decide if public registration should continue to create new stores/admins, or shift to an invite-only system for adding users to existing stores.
    *   **Page-Level Access Control**: Server-side or robust client-side checks on each page to prevent direct URL access by unauthorized roles.
    *   **Component-Level Access Control**: Conditionally render UI elements/actions within pages based on role (e.g., only managers see 'Edit Product', cashiers can't access settings).
    *   **Firestore Security Rules**: Implement comprehensive Firestore security rules to enforce data access and modification permissions for each role at the backend. This is critical for security.
2.  **Payment Gateway Integration**:
    *   Integrate with real payment gateways (e.g., Stripe, Square) for actual card processing.
    *   Handle payment intents, tokenization, and secure transaction processing.
    *   Manage payment terminal hardware integration if applicable.
3.  **Appointment Booking System (for Services)**:
    *   For services marked as `isBookable`.
    *   Calendar UI for viewing availability and booking appointments.
    *   Staff assignment and resource management for bookings.
    *   Customer notifications for bookings (confirmations, reminders).
4.  **Advanced Reporting & Analytics**:
    *   Develop comprehensive reports beyond basic transaction listing: sales summaries (by product, category, staff, time period), profit/loss, inventory value, customer analytics.
    *   Visual dashboards with customizable date ranges and filters, using live aggregated data.
    *   Consider Firebase Functions for data aggregation.
5.  **Full "Cloud Only (Strict Sync)" Mode Implementation**:
    *   Extend the `await` and UI blocking pattern to *all* data write operations throughout the application when this mode is active (currently demonstrated for add/edit product and finalize sale).
    *   Implement a global UI loading/blocking state manager for this mode.
    *   Evaluate if reads should also bypass cache (`getDocFromServer`, `getDocsFromServer`) in this mode for absolute consistency, and implement if necessary.
6.  **Real-time Multi-Terminal Stock & Data Updates**:
    *   While Firestore syncs, achieving near real-time stock visibility across all active terminals without *any* delay might require Firestore real-time listeners on critical data (e.g., product stock) and more sophisticated client-side state management for merging updates.
7.  **Advanced Offline Conflict Resolution UI**:
    *   For "Offline Friendly" mode, design and implement UI/UX for handling scenarios where an offline-queued operation (e.g., transaction) fails during server sync due to conflicts (e.g., insufficient stock discovered upon sync). This involves alerting the user and providing tools to resolve the issue (e.g., voiding part of a sale, suggesting alternatives).

## II. Specific Page/Feature TODOs

### A. Dashboard (`/dashboard`)
-   Connect charts and KPI cards to live, aggregated data from Firestore.
-   Implement dynamic date range filters for all dashboard widgets.

### B. Terminal (`/terminal`)
-   **Payment**:
    *   Implement "Split Payment" functionality.
    *   Implement "Other Payment Methods" (e.g., gift cards, store credit).
-   **Discounts**:
    *   Implement a robust manual discount feature (percentage or fixed amount, per item or per cart).
    *   Develop a system for managing and validating more complex promo codes (e.g., usage limits, expiry dates, item-specific).
-   **Receipts**:
    *   Integrate with services like Twilio (SMS) and SendGrid/Mailgun (Email) for actual digital receipt sending.
    *   Implement receipt printing functionality.
-   **Hardware Integration**: Interface with barcode scanners, cash drawers.
-   **UI/UX**: Keyboard shortcuts, configurable quick-add buttons, "Park Sale" / "Hold Sale", tip management.

### C. Inventory (`/inventory`)
-   **CSV Import**: Implement full CSV parsing logic to create/update products in Firestore. Include error handling and preview for imported data.
-   **Stock Adjustments**: Dedicated UI/flow for adjusting stock quantities (receiving, counts, shrinkage/damage) with history logging.
-   **Product History**: View sales, stock adjustments, price changes for a product.
-   **Advanced Product Features**: Product variants, modifiers, composite products/bundles.
-   **Purchase Orders**: System for creating and managing purchase orders to suppliers.

### D. Services (`/services`)
-   Implement the "Edit Service" page and functionality.
-   Implement full CSV Import functionality for services.

### E. Customers (`/customers`)
-   Implement "Edit Profile" page for customers.
-   Develop "View Purchase History" for individual customers.
-   Implement "Adjust Loyalty Points" functionality.
-   Implement "Delete Customer" functionality (consider implications for transaction history).
-   Customer tagging and segmentation.

### F. Transactions (`/transactions`)
-   **Refunds**: Implement a full refund process (partial/full), handle stock return, link to original sale, update customer data.
-   **CSV Export**: Implement CSV export for the transaction list with selected filters.
-   **End-of-Day/Shift Reports**: UI for generating Z-reports or shift summaries.

### G. AI Predictive Inventory (`/inventory/predictive`)
-   Connect AI input forms to live product data from Firestore instead of mock product lists.
-   Refine Genkit prompts with more sophisticated logic based on real store data patterns.
-   Consider using Firebase Functions for periodic background AI analysis.
-   UI for users to provide feedback on AI suggestions.

### H. Settings
-   **Store Settings (`/settings/store`)**:
    *   Implement actual logo file upload (e.g., to Firebase Cloud Storage) and update `logoUrl`.
-   **Receipt Settings (`/settings/receipts`)**:
    *   Save all customization options to the `Store` document in Firestore.
    *   Dynamically apply these settings when generating/displaying receipts.
    *   Implement "Send Test Receipt" functionality.
-   **Tax Settings (`/settings/taxes`)**: UI for detailed tax rule configuration and application.
-   **Business Hours (`/settings/hours`)**: UI to set operational hours, save to `Store` doc.
-   **Notifications (`/settings/notifications`)**: Actual notification system (in-app, email, push) and user preferences.
-   **Product Settings (Global) (`/settings/products`)**: Manage global product categories, variant/modifier templates.
-   **Security (`/settings/security`)**: Two-Factor Authentication (2FA), password policies, audit logs.
-   **Devices (`/settings/devices`)**: Register and manage POS devices/terminals, assign terminal-specific settings.
-   **Subscription (`/settings/subscription`)**: Integrate with a billing platform for plan management.
-   **Appearance (`/settings/appearance`)**: Implement actual theme customization options.
-   **Integrations (`/settings/integrations`)**: Develop actual third-party integrations.
-   **Payment Gateways (`/settings/payments`)**: Implement connections beyond placeholders.
-   **User Management (`/settings/users`)**: Build the UI as per section I.1.

## III. General System Enhancements

1.  **Comprehensive Error Handling**: Granular error handling for all operations, user-friendly messages, centralized logging.
2.  **Testing**:
    *   **Unit Tests**: For individual functions and components.
    *   **Integration Tests**: For interactions between components and services.
    *   **End-to-End (E2E) Tests**: For critical user flows.
3.  **Performance Optimization**:
    *   Analyze and optimize Firestore query performance for large datasets (indexing, data denormalization if necessary).
    *   Lazy loading components and routes where appropriate.
    *   Image optimization strategy.
    *   Bundle size reduction.
    *   Strategies for efficient initial data load and caching for very large catalogs (50k+ items).
4.  **Accessibility (a11y)**: Full accessibility review (WCAG compliance), ensure ARIA attributes, keyboard navigation, screen reader compatibility.
5.  **Internationalization (i18n) & Localization (l10n)**: Framework for translations, locale-based formatting if needed.
6.  **Accurate Pending Write Detection for Sync Indicator**: For "Offline Friendly" mode, investigate more accurate ways to determine if Firestore has pending writes queued locally, rather than the current simulation based on `navigator.onLine`.
7.  **Database Seeding & Migrations**: Robust scripts for seeding, strategy for schema migrations.
8.  **Documentation**: User guides, developer documentation.

This list represents a significant amount of work but covers key areas for maturing the PerfectPOS application.

    