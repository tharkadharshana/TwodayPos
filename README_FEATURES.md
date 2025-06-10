
# PerfectPOS - Current Features

This document outlines the current features and functionalities implemented in the PerfectPOS system.

## Core Technologies
- **Next.js**: Framework for server-rendered React applications.
- **React**: JavaScript library for building user interfaces.
- **ShadCN UI**: Re-usable UI components.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Firebase**: Backend platform, primarily using:
    - **Firestore**: NoSQL database for storing application data (products, transactions, users, store settings).
    - **Firebase Authentication**: For user login and registration.
- **Genkit (Firebase AI)**: Toolkit for integrating AI features (used for predictive inventory).
- **TypeScript**: For static typing and improved code quality.
- **Zod**: For schema validation.
- **React Hook Form**: For form management.

## 1. Authentication
- **Login**:
    - Users can log in using their email and password.
    - Basic error handling for invalid credentials or too many attempts.
    - UI placeholder for Biometric Login (functionality not implemented).
- **Registration**:
    - New users can register with a display name, email, and password.
    - Passwords require confirmation.
    - Upon successful registration, an initial `Store` document and a `UserDocument` are automatically created in Firestore, linking the user to their new store.

## 2. Application Shell & Navigation
- **Responsive Sidebar**:
    - Collapsible sidebar for navigation (icon-only or full view).
    - Adapts to mobile view with an off-canvas drawer.
- **User Menu**:
    - Displays logged-in user's avatar and name/email.
    - Dropdown with links:
        - Profile (placeholder page).
        - Billing (placeholder page).
        - Settings (navigates to `/settings`).
        - Logout (signs out the user and redirects to login).
- **Theme Toggle**: Allows users to switch between Light, Dark, and System themes.
- **Sync Status Indicator**:
    - Visually indicates the browser's online/offline status (`navigator.onLine`).
    - Simulates a "syncing" state (pulsing yellow icon) when transitioning from offline to online.
    - Shows "Online & Synced" (green icon) or "Offline" (red icon) with corresponding tooltips.
    - The "pending items" count in the tooltip is currently a basic simulation.

## 3. Dashboard (`/dashboard`)
- Displays static sample data for:
    - **Key Performance Indicator (KPI) Cards**: Total Revenue, Transactions, Average Sale Value.
    - **Sales Trend Chart**: Bar chart showing monthly sales.
    - **Payment Methods Chart**: Pie chart showing distribution of payment methods.
    - **Top Selling Products List**: List of products by revenue/quantity.
    - **Inventory Alerts**: Mock alerts for low stock items and reorder confirmations.
- Charts use `recharts` and `shadcn/ui` chart components.

## 4. Terminal (`/terminal` - formerly Sales)
- **Catalog Display**:
    - Grid layout showing available products and services.
    - Products display image (or placeholder), name, price, and stock quantity.
    - Services display image (or `ConciergeBell` icon), name, price, and duration (if any).
    - Items out of stock are visually distinct and cannot be added to the cart.
- **Search & Filtering**:
    - Search bar to filter catalog items by name or SKU.
    - Category filter buttons (All, Favorites, Drinks, etc. - "Favorites" shows first 4 items as mock).
- **Cart Management**:
    - Add items from catalog to the current order.
    - Increment/decrement quantity of items in the cart.
    - Manually set exact quantity for an item.
    - Remove individual items from the cart.
    - "Undo Last Cart Action" button (reverts adding a new item or the last quantity increment).
    - "Clear Cart" button with confirmation dialog (clears items and promo code, preserves assigned customer).
- **Customer Management (Integrated)**:
    - Assign an existing customer to the transaction via a modal:
        - Search customers by name, email, or phone.
        - Select a customer from the search results.
    - Add a new customer directly from the same modal:
        - Form for name (required), email, phone, notes.
        - Saves the new customer to Firestore and assigns them to the current transaction.
    - Clear assigned customer from the transaction.
- **Discounts**:
    - Apply (mock) promo codes (e.g., "SAVE5", "TENOFF" - hardcoded).
    - UI placeholder for "Add Manual Discount" button.
- **Payment Processing (Simulated)**:
    - Multi-step checkout process (Order -> Payment -> Receipt).
    - Select payment method: Cash or Card. UI placeholders for "Split Payment" and "Other Methods".
    - **Cash Payment**:
        - Input for amount tendered.
        - Quick tender amount buttons.
        - Calculates and displays change due.
        - "Process Cash" button (simulates processing).
    - **Card Payment**:
        - Displays total and a message to use the card terminal.
        - "Process Card" button (simulates processing).
- **Digital Receipts (Simulated)**:
    - After payment processing, options to:
        - Enter recipient's phone or email.
        - "Send SMS" or "Send Email" (shows a toast, no actual sending).
        - "No Receipt" option.
- **Transaction Finalization**:
    - Saves the transaction details (items, totals, customer, cashier, payment method, promo code, terminal ID) to Firestore.
    - If products are sold, their `stockQuantity` is decremented in Firestore.
    - Customer's `totalSpent`, `loyaltyPoints`, and `lastPurchaseAt` are updated if a customer is assigned.
    - Handles data saving according to the selected `dataHandlingMode` (awaits for 'cloudOnlyStrict', optimistic for 'offlineFriendly').
- **Layout**: Responsive three-column layout designed for POS operations, with minimum column widths for better stability on various screen sizes.

## 5. Inventory Management (`/inventory`)
- **Product Listing**:
    - Displays a table of products fetched live from Firestore, specific to the user's store.
    - Shows image, name, SKU, category, price, stock quantity, and status.
- **Search**: Filter products by name, SKU, or category.
- **Add New Product (`/inventory/add`)**:
    - Dedicated form with fields for all product attributes (name, SKU, price, stock, category, description, low stock threshold, image URL, supplier, barcode, visibility).
    *   Input validation using Zod and React Hook Form.
    *   Saves the new product to Firestore.
    *   Handles data saving according to `dataHandlingMode`.
- **Edit Product (`/inventory/edit/[productId]`)**:
    - Dedicated form pre-filled with the selected product's data from Firestore.
    - Allows modification of product attributes.
    - Updates the product in Firestore.
    *   Handles data saving according to `dataHandlingMode`.
- **Delete Product**:
    - Option in each product row's dropdown menu.
    - Triggers a confirmation dialog before deletion.
    - Removes the product from Firestore.
- **Stock Status Badges**: Visually indicates "In Stock", "Low Stock", or "Out of Stock".
- **CSV Data Management**:
    - **Export All Products**: Downloads a CSV file of all products for the store.
    - **Export CSV Template**: Downloads a blank CSV template for importing products.
    - **Import CSV**: UI to select a CSV file. Actual data parsing and import logic is a TODO.
- **Link to AI Predictions**: Navigates to the AI Predictive Inventory page.

## 6. AI Predictive Inventory (`/inventory/predictive`)
- **UI for AI Flows**:
    - Separate cards for "Predict Stock-Outs" and "Smart Reorder Suggestions".
    - Forms allow selecting a (mock) product from a predefined list.
    - Product details (current stock, sales velocity, lead time) are displayed based on selection.
- **Genkit Integration**:
    - Buttons trigger calls to Genkit flows:
        - `predictStockOuts`: Takes product info and returns a stock-out prediction and basic reorder suggestion.
        - `getSmartReorderSuggestions`: Takes product info and sales timeframe, returns suggested reorder quantity, low stock alert status, and reasoning.
    - Results from the AI flows are displayed below the respective forms.
    - Genkit setup (`ai/genkit.ts`) uses Google AI models.

## 7. Services Management (`/services`)
- **Service Listing**:
    - Displays a table of services fetched live from Firestore for the user's store.
    - Shows name, category, price, duration, and visibility status.
- **Search**: Filter services by name, category, or description.
- **Add New Service (`/services/add`)**:
    - Dedicated form for service attributes (name, price, duration, category, description, image URL, visibility, bookable status).
    - Input validation using Zod and React Hook Form.
    - Saves the new service to Firestore.
- **Delete Service**:
    - Option in each service row's dropdown menu.
    - Triggers a confirmation dialog.
    - Removes the service from Firestore.
- **Visibility Badge**: Shows if a service is "Visible" or "Hidden" on the POS.
- **CSV Data Management**:
    - **Export All Services**: Downloads a CSV of all services.
    - **Export CSV Template**: Downloads a blank CSV template for services.
    - **Import CSV**: UI to select a CSV file. Actual import logic is a TODO.
- **Edit Service**: Menu item is present but disabled (functionality is a TODO).

## 8. Customer Management (`/customers`)
- **Customer Listing**:
    - Displays a table of customers fetched live from Firestore for the user's store.
    - Shows avatar (placeholder), name, contact info (email/phone), total spent, and loyalty points.
- **Search**: Filter customers by name, email, or phone.
- **Actions (Placeholders)**: Dropdown menu for each customer includes:
    - Edit Profile (TODO)
    - View Purchase History (TODO)
    - Adjust Loyalty Points (TODO)
    - Delete Customer (TODO)
- **Add Customer**: Functionality is integrated into the Terminal page modal.

## 9. Transaction History (`/transactions`)
- **Transaction Listing**:
    - Displays a table of the most recent (default 50) transactions from Firestore for the user's store.
    - Shows transaction ID (shortened), date/time, customer name, cashier name, total amount, and payment status.
- **Search**: Filter transactions by ID, customer name, or cashier name.
- **View Details**:
    - Clicking "View Details" in a transaction's dropdown opens a modal.
    - Modal displays:
        - Full transaction ID and timestamp.
        - Customer and cashier names.
        - Detailed list of items (name, quantity, unit price, total price).
        - Financial summary (subtotal, discount with promo code if any, tax, total paid).
        - Payment method and status (with badge).
        - Digital receipt status, channel, and recipient (if applicable).
        - Notes, offline processing/sync status (if applicable).
- **Modal Actions**:
    - **Resend Receipt (Simulated)**: Shows a toast; actual sending is a TODO. Disabled if no recipient info.
    - **Start Refund (Placeholder)**: Shows a toast; full refund process is a TODO. Visible for 'completed' transactions.
- **Status Badges**: Color-coded badges for transaction status (e.g., completed, refunded).
- **CSV Export (Placeholder)**: Button exists, functionality is a TODO.

## 10. Settings
- **Main Settings Page (`/settings`)**: A hub with cards linking to various settings sub-pages.
- **Store Settings (`/settings/store`)**:
    - Form to edit store details: name, slogan, logo URL (with local preview on file select), contact phone, email, full address.
    - Form to edit default tax rate (as a decimal, e.g., 0.08 for 8%) and currency code (e.g., USD).
    - Options for "Show address on digital receipts" and "Display online ordering link".
    - Saves changes to the `Store` document in Firestore.
- **Receipt Settings (`/settings/receipts`)**:
    - UI to customize digital receipts:
        - Upload new logo (placeholder, shows preview).
        - Header and footer messages.
        - Checkboxes for information to display (store name, address, phone, cashier, time, loyalty points).
        - Default messages for SMS and Email receipts (with placeholder support like `{StoreName}`).
    - Includes a static preview of how a receipt might look.
    - Saving these settings to Firestore and applying them is a TODO. "Send Test Receipt" is a placeholder.
- **Offline & Sync Settings (`/settings/offline-sync`)**:
    - Allows users to choose a data handling mode:
        - **Offline Friendly (Recommended)**: Default. Leverages Firestore's built-in persistent cache.
        - **Cloud Only (Strict Sync)**: Makes critical operations (add/edit product, finalize sale) `await` server confirmation.
    - The selected preference is saved to the `Store` document in Firestore.
    - The `UserContext` makes this mode available globally for components to adapt their behavior.
- **Placeholder Settings Pages**:
    - Appearance, Devices, Business Hours, Integrations, Notifications, Product Settings (global), Payment Gateways, Security, Subscription, Tax Settings, User Management.
    - These pages currently display a message indicating the feature is under development.

## 11. Data Handling & Offline Support
- **Offline Friendly Mode (Default)**:
    - **Firestore Persistent Cache**: Enabled via `persistentLocalCache` in `src/lib/firebase.ts`. Firestore uses IndexedDB to store data locally, allowing the app to function offline by reading from and writing to this cache.
    - **Automatic Sync**: Firestore's SDK handles syncing local changes to the cloud when online and fetching updates from the server.
    - **Optimistic Writes**: UI updates immediately upon local cache write, providing a responsive experience.
- **Cloud Only (Strict Sync) Mode**:
    - **Behavior**: When selected in settings, specific critical operations are modified:
        - **Add Product**: Waits for Firestore server confirmation before completing.
        - **Edit Product**: Waits for Firestore server confirmation.
        - **Finalize Sale (Terminal)**: Waits for Firestore server confirmation for the transaction and related updates.
    - **UI Feedback**: During these awaited operations, relevant buttons (Save, Process Payment) are disabled and may show a loader.
    - **Partial Implementation**: This strict behavior is currently implemented for the key flows mentioned above. Extending it to all write operations across the application is a significant future task.

## 12. Developer Utilities
- **Populate Dummy Data (`/dev/populate-data`)**:
    - A page accessible to developers to add sample products, customers, and transactions to their store.
    - Useful for testing and development without manual data entry.
    - Displays toast notifications for progress.

## 13. Code Structure & Quality
- **TypeScript**: Used throughout for type safety.
- **Modular Components**: UI elements are broken down into re-usable components (largely from ShadCN).
- **Utility Functions**: Helper functions for common tasks (e.g., `cn` for class names, Firestore interactions in `firestoreUtils.ts`).
- **Context API**: `UserContext` for managing global user state, store details, and selected data handling mode.
- **Environment Variables**: Firebase configuration is managed via `.env` variables (e.g., `NEXT_PUBLIC_FIREBASE_API_KEY`).

This summary covers the main features and their current state of implementation.

    