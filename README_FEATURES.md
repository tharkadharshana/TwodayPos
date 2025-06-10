
# PerfectPOS - Current Features

This document outlines the current features and functionalities implemented in the PerfectPOS system.

## Core Technologies
- **Next.js**: Framework for server-rendered React applications (App Router).
- **React**: JavaScript library for building user interfaces.
- **ShadCN UI**: Re-usable UI components.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Firebase**: Backend platform, primarily using:
    - **Firestore**: NoSQL database for storing application data (products, transactions, users, store settings). Offline persistence is enabled via Firestore's `persistentLocalCache` (using IndexedDB), forming the backbone of the "Offline Friendly" mode.
    - **Firebase Authentication**: For user login and registration.
- **Genkit (Firebase AI)**: Toolkit for integrating AI features (used for predictive inventory, with mock product data in forms).
- **TypeScript**: For static typing and improved code quality.
- **Zod**: For schema validation.
- **React Hook Form**: For form management.

## 1. Authentication
- **Login**:
    - Users can log in using their email and password.
    - Basic error handling for invalid credentials or too many attempts.
    - UI placeholder for Biometric Login (functionality not implemented).
- **Registration**:
    - New users can register with a display name, email, and password. All new users are currently created as 'admin' of their own new store.
    - Passwords require confirmation.
    - Upon successful registration, an initial `Store` document (with `dataHandlingMode` defaulting to `offlineFriendly`) and a `UserDocument` (with `role: 'admin'`) are automatically created in Firestore, linking the user to their new store.

## 2. Application Shell & Navigation
- **Responsive Sidebar**:
    - Collapsible sidebar for navigation (icon-only or full view).
    - Adapts to mobile view with an off-canvas drawer.
    - Navigation items are filtered based on the logged-in user's role (`admin`, `manager`, `cashier`).
- **User Menu**:
    - Displays logged-in user's avatar and name/email.
    - Dropdown with links: Profile (placeholder), Billing (placeholder), Settings (navigates to `/settings`), Logout.
- **Theme Toggle**: Allows users to switch between Light, Dark, and System themes.
- **Sync Status Indicator**:
    - Visually indicates the browser's online/offline status (`navigator.onLine`).
    - Simulates a "syncing" state (pulsing yellow icon) when transitioning from offline to online or on initial load.
    - Shows "Online & Synced" (green icon) or "Offline" (red icon) with corresponding tooltips. This indicator reflects browser connectivity; Firestore's internal sync queue is not directly displayed.

## 3. Dashboard (`/dashboard`)
- Displays static sample data for:
    - **Key Performance Indicator (KPI) Cards**: Total Revenue, Transactions, Average Sale Value.
    - **Sales Trend Chart**: Bar chart showing monthly sales.
    - **Payment Methods Chart**: Pie chart showing distribution of payment methods.
    - **Top Selling Products List**: List of products by revenue/quantity.
    - **Inventory Alerts**: Mock alerts for low stock items and reorder confirmations.
- Charts use `recharts` and `shadcn/ui` chart components.
- Accessible to `admin`, `manager`, `cashier`.

## 4. Terminal (`/terminal` - formerly Sales)
- **Catalog Display**:
    - Grid layout showing available products and services fetched from Firestore.
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
        - Form for name (required), email, phone, notes (using `react-hook-form` and `zod`).
        - Saves the new customer to Firestore and assigns them to the current transaction.
    - Clear assigned customer from the transaction.
- **Discounts**:
    - Apply (mock) promo codes (e.g., "SAVE5", "TENOFF" - hardcoded).
    - UI placeholder for "Add Manual Discount" button.
- **Payment Processing (Simulated)**:
    - Multi-step checkout process (Order -> Payment -> Receipt).
    - Select payment method: Cash or Card. UI placeholders for "Split Payment" and "Other Methods".
    - **Cash Payment**: Input for amount tendered, quick tender buttons, calculates change.
    - **Card Payment**: Displays total, message to use card terminal.
- **Digital Receipts (Simulated)**: Options for phone/email input, "Send SMS"/"Send Email" (shows toast), "No Receipt".
- **Transaction Finalization**:
    - Saves transaction details (items, totals, customer, cashier, payment, promo, terminal ID) to Firestore.
    - Decrements product `stockQuantity` in Firestore if products are sold.
    *   Updates customer `totalSpent`, `loyaltyPoints`, `lastPurchaseAt` if assigned.
    *   **Data Handling Mode Aware**: If `dataHandlingMode` is 'cloudOnlyStrict', waits for Firestore server confirmation before completing. Otherwise (offlineFriendly), writes are optimistic.
- **Layout**: Responsive three-column layout with minimum column widths for better stability.
- Accessible to `admin`, `manager`, `cashier`.

## 5. Inventory Management (`/inventory`)
- **Product Listing**:
    - Displays a table of products fetched live from Firestore, specific to the user's store.
    - Shows image, name, SKU, category, price, stock quantity, and status.
- **Search**: Filter products by name, SKU, or category.
- **Add New Product (`/inventory/add`)**:
    - Dedicated form with fields for all product attributes.
    *   Input validation using Zod and React Hook Form.
    *   Saves the new product to Firestore.
    *   **Data Handling Mode Aware**: If `dataHandlingMode` is 'cloudOnlyStrict', waits for Firestore server confirmation before completing. Otherwise (offlineFriendly), writes are optimistic.
- **Edit Product (`/inventory/edit/[productId]`)**:
    - Dedicated form pre-filled with the selected product's data from Firestore.
    - Allows modification of product attributes.
    - Updates the product in Firestore.
    *   **Data Handling Mode Aware**: If `dataHandlingMode` is 'cloudOnlyStrict', waits for Firestore server confirmation. Otherwise (offlineFriendly), writes are optimistic.
- **Delete Product**:
    - Option in each product row's dropdown menu.
    - Triggers a confirmation dialog before deletion.
    - Removes the product from Firestore.
- **Stock Status Badges**: Visually indicates "In Stock", "Low Stock", or "Out of Stock".
- **CSV Data Management**:
    - **Export All Products**: Downloads a CSV file of all products.
    - **Export CSV Template**: Downloads a blank CSV template.
    - **Import CSV**: UI to select a CSV file. Actual data parsing/import logic is a TODO.
- **Link to AI Predictions**: Navigates to the AI Predictive Inventory page.
- Accessible to `admin`, `manager`.

## 6. AI Predictive Inventory (`/inventory/predictive`)
- **UI for AI Flows**:
    - Separate cards for "Predict Stock-Outs" and "Smart Reorder Suggestions".
    - Forms allow selecting a (mock) product from a predefined list (not live inventory data).
    - Product details (current stock, sales velocity, lead time) are displayed based on selection.
- **Genkit Integration**:
    - Buttons trigger calls to Genkit flows: `predictStockOuts`, `getSmartReorderSuggestions`.
    - Results from the AI flows are displayed.
    - Genkit setup (`ai/genkit.ts`) uses Google AI models.
- Accessible to `admin`, `manager`.

## 7. Services Management (`/services`)
- **Service Listing**:
    - Displays a table of services fetched live from Firestore for the user's store.
    - Shows name, category, price, duration, and visibility status.
- **Search**: Filter services by name, category, or description.
- **Add New Service (`/services/add`)**:
    - Dedicated form for service attributes.
    - Input validation using Zod and React Hook Form.
    - Saves the new service to Firestore.
- **Delete Service**:
    - Option in each service row's dropdown menu with confirmation dialog.
    - Removes the service from Firestore.
- **Visibility Badge**: Shows if a service is "Visible" or "Hidden" on the POS.
- **CSV Data Management**: Export all, export template. Import CSV UI is present, logic is a TODO.
- **Edit Service**: Menu item is present but disabled (functionality is a TODO).
- Accessible to `admin`, `manager`.

## 8. Customer Management (`/customers`)
- **Customer Listing**:
    - Displays a table of customers fetched live from Firestore for the user's store.
    - Shows avatar, name, contact info, total spent, loyalty points.
- **Search**: Filter customers by name, email, or phone.
- **Actions (Placeholders)**: Edit Profile, View Purchase History, Adjust Loyalty, Delete Customer are TODOs.
- **Add Customer**: Functionality is integrated into the Terminal page modal.
- Accessible to `admin`, `manager`.

## 9. Transaction History (`/transactions`)
- **Transaction Listing**:
    - Displays a table of the most recent (default 50) transactions from Firestore for the user's store.
    - Shows transaction ID, date/time, customer, cashier, total, and status.
- **Search**: Filter transactions by ID, customer name, or cashier name.
- **View Details**: Modal displays full transaction details.
- **Modal Actions**: "Resend Receipt" (simulated), "Start Refund" (placeholder).
- **Status Badges**: Color-coded badges for transaction status.
- **CSV Export (Placeholder)**: Button exists, functionality is a TODO.
- Accessible to `admin`, `manager`, `cashier`.

## 10. Settings
- **Main Settings Page (`/settings`)**: Hub with cards linking to sub-pages. Accessible to `admin`, `manager`, `cashier`.
- **Store Settings (`/settings/store`)**:
    - Form to edit store details (name, slogan, logo URL, contact, address).
    - Form to edit default tax rate and currency code.
    - Options for "Show address on digital receipts" and "Display online ordering link".
    - Saves changes to the `Store` document in Firestore.
    - Accessible to `admin`, `manager`.
- **Receipt Settings (`/settings/receipts`)**:
    - UI to customize digital receipts (logo upload placeholder, header/footer messages, display options, default SMS/Email messages).
    - Static preview. Saving settings and applying them is a TODO. "Send Test Receipt" is a placeholder.
    - Accessible to `admin`, `manager`.
- **Offline & Sync Settings (`/settings/offline-sync`)**:
    - Allows users to choose a data handling mode:
        - **Offline Friendly (Recommended)**: Default. Leverages Firestore's built-in persistent cache.
        - **Cloud Only (Strict Sync)**: See "Data Handling & Offline Support" section below.
    - The selected preference is saved to the `Store` document in Firestore and made available globally via `UserContext`.
    - Accessible to `admin`, `manager`.
- **Developer Tools (`/dev/populate-data`)**:
    - Page to populate dummy products, customers, and transactions.
    - Accessible to `admin`.
- **Placeholder Settings Pages**:
    - Appearance, Devices, Business Hours, Integrations, Notifications, Product Settings (global), Payment Gateways, Security, Subscription, Tax Settings, User Management. These are stubs.

## 11. Data Handling & Offline Support
- **Data Handling Modes**: User can choose between "Offline Friendly" and "Cloud Only (Strict Sync)" in settings.
    - **Offline Friendly Mode (Default & Recommended)**:
        - **Firestore Persistent Cache**: Enabled via `persistentLocalCache` in `src/lib/firebase.ts`. Firestore uses IndexedDB to store data locally, allowing the app to function offline by reading from and writing to this cache.
        - **Automatic Sync**: Firestore's SDK handles syncing local changes to the cloud when online and fetching updates.
        - **Optimistic Writes**: UI updates immediately upon local cache write.
    - **Cloud Only (Strict Sync) Mode**:
        - **Behavior**: When selected, specific critical operations are modified to `await` server confirmation:
            - **Add Product**: Waits for Firestore server confirmation.
            - **Edit Product**: Waits for Firestore server confirmation.
            - **Finalize Sale (Terminal)**: Waits for Firestore server confirmation.
        - **UI Feedback**: During these awaited operations, relevant buttons are disabled and may show a loader.
        - **Partial Implementation**: This strict behavior is currently implemented for the key flows mentioned above as a demonstration. Extending it to *all* write operations across the application is a significant future task.

## 12. Code Structure & Quality
- **TypeScript**: Used throughout for type safety.
- **Modular Components**: UI elements are broken down into re-usable components.
- **Utility Functions**: Helper functions for common tasks (`cn`, Firestore interactions in `firestoreUtils.ts`).
- **Context API**: `UserContext` for managing global user state, store details, and selected data handling mode.
- **Environment Variables**: Firebase configuration managed via `.env`.

This summary covers the main features and their current state of implementation.

    