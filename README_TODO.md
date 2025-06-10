
# PerfectPOS - TODO & Future Development

This document lists features that are currently placeholders, partially implemented, or represent future work required to enhance the PerfectPOS system into a fully production-grade application.

## I. Major Features & Systems to Implement/Complete

1.  **User Roles & Permissions**:
    *   Implement distinct functionalities and UI restrictions based on user roles (e.g., 'manager', 'cashier' vs. 'admin').
    *   Secure Firestore rules to enforce these roles server-side.
2.  **Payment Gateway Integration**:
    *   Integrate with real payment gateways (e.g., Stripe, Square, Adyen) for actual card processing.
    *   Handle payment intents, tokenization, and secure transaction processing.
    *   Manage payment terminal hardware integration if applicable.
3.  **Appointment Booking System**:
    *   For services marked as `isBookable`.
    *   Calendar UI for viewing availability and booking appointments.
    *   Staff assignment and resource management for bookings.
    *   Customer notifications for bookings (confirmations, reminders).
4.  **Advanced Reporting & Analytics**:
    *   Develop comprehensive reports beyond basic transaction listing:
        *   Sales summaries (daily, weekly, monthly, by product, by category, by staff).
        *   Profit and loss analysis.
        *   Inventory value and turnover.
        *   Customer analytics (top spenders, purchase frequency).
    *   Visual dashboards with customizable date ranges and filters.
    *   Consider using Firebase Functions for data aggregation and Cloud Storage for report generation.
5.  **Full "Cloud Only (Strict Sync)" Mode Implementation**:
    *   Extend the `await` and UI blocking pattern to *all* data write operations throughout the application when this mode is active.
    *   Implement a global UI loading/blocking state manager to prevent concurrent operations or navigation during strict sync writes.
    *   Evaluate if reads should also bypass cache (`getDocFromServer`, `getDocsFromServer`) in this mode for absolute consistency, and implement if necessary.
6.  **Real-time Multi-Terminal Stock & Data Updates**:
    *   While Firestore syncs eventually, achieving near real-time stock visibility across all active terminals without any delay might require Firestore real-time listeners on critical data (e.g., product stock) and more sophisticated client-side state management to merge these updates.
    *   Consider strategies for broadcasting urgent updates (e.g., last item sold).

## II. Specific Page/Feature TODOs

### A. Dashboard (`/dashboard`)
-   Connect charts and KPI cards to live, aggregated data from Firestore.
-   Implement dynamic date range filters for all dashboard widgets.
-   Allow customization of dashboard layout and widgets.

### B. Terminal (`/terminal`)
-   **Payment**:
    *   Implement "Split Payment" functionality.
    *   Implement "Other Payment Methods" (e.g., gift cards, store credit).
-   **Discounts**:
    *   Implement a robust manual discount feature (percentage or fixed amount, per item or per cart).
    *   Develop a system for managing and validating more complex promo codes (e.g., usage limits, expiry dates, item-specific).
-   **Receipts**:
    *   Integrate with services like Twilio (SMS) and SendGrid/Mailgun (Email) for actual digital receipt sending.
    *   Implement receipt printing functionality (browser print or via connected receipt printers).
-   **Hardware Integration**:
    *   Interface with barcode scanners for quick item lookup.
    *   Integrate with cash drawers.
-   **UI/UX**:
    *   Keyboard shortcuts for common actions (e.g., add to cart, payment, search).
    *   Configurable quick-add buttons for popular items.
    *   "Park Sale" / "Hold Sale" functionality.
    *   Tip management.

### C. Inventory (`/inventory`)
-   **CSV Import**: Implement full CSV parsing logic to create/update products in Firestore. Include error handling and preview for imported data.
-   **Stock Adjustments**:
    *   Dedicated UI/flow for adjusting stock quantities (e.g., receiving new stock, stock counts, marking shrinkage/damage).
    *   Log stock adjustment history.
-   **Product History**: Implement "View Product History" to show sales, stock adjustments, and price changes for a product.
-   **Advanced Product Features**:
    *   Product variants (e.g., size, color) with separate SKUs, prices, and stock.
    *   Modifiers/Add-ons for products.
    *   Composite products/bundles.
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
-   **Refunds**:
    *   Implement a full refund process (partial or full).
    *   Handle stock return for refunded products.
    *   Link refunded transactions to original sales.
    *   Update customer spending/loyalty data.
-   **CSV Export**: Implement CSV export for the transaction list with selected filters.
-   **End-of-Day/Shift Reports**: UI for generating Z-reports or shift summaries.

### G. AI Predictive Inventory (`/inventory/predictive`)
-   Connect AI input forms to live product data from Firestore instead of mock product lists.
-   Refine Genkit prompts with more sophisticated logic based on real store data patterns (e.g., seasonality, promotions).
-   Consider using Firebase Functions to run AI analysis periodically in the background and store results for quick retrieval.
-   UI for users to provide feedback on AI suggestions to improve the models.

### H. Settings
-   **Store Settings (`/settings/store`)**:
    *   Implement actual logo file upload (e.g., to Firebase Cloud Storage) and update `logoUrl`.
-   **Receipt Settings (`/settings/receipts`)**:
    *   Save all customization options to the `Store` document in Firestore.
    *   Dynamically apply these settings when generating/displaying receipts.
    *   Implement "Send Test Receipt" functionality.
-   **Tax Settings (`/settings/taxes`)**:
    *   UI for detailed tax rule configuration (e.g., multiple tax rates, location-based taxes, item-specific tax exemptions).
    *   Apply these rules correctly during transaction calculation.
-   **Business Hours (`/settings/hours`)**:
    *   UI to set operational hours for different days of the week.
    *   Save to `Store` document.
    *   Potentially use this information elsewhere in the app (e.g., disabling online orders outside hours).
-   **User Management (`/settings/users`)**:
    *   UI for admins to invite, add, edit, and deactivate user accounts within their store.
    *   Assign roles (admin, manager, cashier) to users.
-   **Notifications (`/settings/notifications`)**:
    *   Implement an actual notification system (in-app, email, or push) for events like low stock alerts, large sales, etc.
    *   User preferences for which notifications to receive.
-   **Product Settings (Global) (`/settings/products`)**:
    *   Manage global product categories.
    *   Define templates for product variants and modifiers.
-   **Security (`/settings/security`)**:
    *   Implement Two-Factor Authentication (2FA) options for users.
    *   Password policies and reset mechanisms.
    *   Audit logs for sensitive actions.
-   **Devices (`/settings/devices`)**:
    *   UI to register and manage POS devices/terminals associated with the store.
    *   Assign terminal-specific settings (e.g., default receipt printer).
-   **Subscription (`/settings/subscription`)**:
    *   Integrate with a billing platform (e.g., Stripe Billing) to manage subscription plans, payments, and feature access based on plan.

## III. General System Enhancements

1.  **Comprehensive Error Handling**:
    *   More granular error handling for Firestore operations and API calls.
    *   User-friendly error messages and recovery options.
    *   Centralized error logging (e.g., Sentry, Firebase Crashlytics).
2.  **Testing**:
    *   **Unit Tests**: For individual functions and components.
    *   **Integration Tests**: For interactions between components and services.
    *   **End-to-End (E2E) Tests**: For critical user flows (e.g., completing a sale, adding a product).
3.  **Performance Optimization**:
    *   Analyze and optimize Firestore query performance, especially for large datasets (indexing, data denormalization if necessary).
    *   Lazy loading components and routes.
    *   Image optimization.
    *   Bundle size reduction.
4.  **Accessibility (a11y)**:
    *   Conduct a full accessibility review (WCAG compliance).
    *   Ensure proper ARIA attributes, keyboard navigation, and screen reader compatibility.
5.  **Internationalization (i18n) & Localization (l10n)**:
    *   If the application needs to support multiple languages and regions.
    *   Framework for managing translations.
    *   Formatting for dates, numbers, and currencies based on locale.
6.  **Accurate Pending Write Detection for Sync Indicator**:
    *   For "Offline Friendly" mode, investigate more accurate ways to determine if Firestore has pending writes queued locally, rather than the current simulation. This might involve listening to metadata changes on queries or using more advanced Firestore SDK features if available.
7.  **Client-Side Conflict Resolution UI (Offline Friendly Mode)**:
    *   Design and implement UI/UX for handling scenarios where an offline-queued transaction fails during server sync due to conflicts (e.g., insufficient stock discovered upon sync). This involves alerting the user and providing tools to resolve the issue.
8.  **Database Seeding & Migrations**:
    *   Implement more robust scripts for seeding development/staging databases.
    *   Develop a strategy for handling data schema migrations as the application evolves.
9.  **Documentation**:
    *   User guides for cashiers and administrators.
    *   Developer documentation for API endpoints and system architecture.

This list represents a significant amount of work but covers key areas for maturing the PerfectPOS application.

    