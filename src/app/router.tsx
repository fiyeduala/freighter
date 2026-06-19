import { createBrowserRouter, Navigate } from "react-router-dom";

// Error pages
import { GlobalErrorPage } from "@/features/auth/pages/GlobalErrorPage";

// Layouts
import { AuthLayout } from "./layouts/AuthLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { CustomerLayout } from "./layouts/CustomerLayout";
import { DriverLayout } from "./layouts/DriverLayout";

// Guards
import { RoleGuard } from "./guards/RoleGuard";

// Auth pages (S-)
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "@/features/auth/pages/ResetPasswordPage";
import { VerifyEmailPage } from "@/features/auth/pages/VerifyEmailPage";
import { OnboardingPage } from "@/features/auth/pages/OnboardingPage";
import { InviteAcceptPage } from "@/features/auth/pages/InviteAcceptPage";
import { NotFoundPage } from "@/features/auth/pages/NotFoundPage";

// Admin pages (A-)
import { AdminDashboardPage } from "@/features/dashboard/pages/admin/AdminDashboardPage";
import { ShipmentsListPage } from "@/features/shipments/pages/admin/ShipmentsListPage";
import { ShipmentDetailPage } from "@/features/shipments/pages/admin/ShipmentDetailPage";
import { CreateShipmentPage } from "@/features/shipments/pages/admin/CreateShipmentPage";
import { AssignDriverPage } from "@/features/shipments/pages/admin/AssignDriverPage";
import { FleetMapPage } from "@/features/tracking/pages/admin/FleetMapPage";
import { TrackingDetailPage } from "@/features/tracking/pages/admin/TrackingDetailPage";
import { OrdersListPage } from "@/features/orders/pages/admin/OrdersListPage";
import { OrderDetailPage } from "@/features/orders/pages/admin/OrderDetailPage";
import { InvoicePage } from "@/features/orders/pages/admin/InvoicePage";
import { CustomersListPage } from "@/features/customers/pages/admin/CustomersListPage";
import { CustomerDetailPage } from "@/features/customers/pages/admin/CustomerDetailPage";
import { AddEditCustomerPage } from "@/features/customers/pages/admin/AddEditCustomerPage";
import { DriversListPage } from "@/features/drivers/pages/admin/DriversListPage";
import { DriverDetailPage } from "@/features/drivers/pages/admin/DriverDetailPage";
import { AddInviteDriverPage } from "@/features/drivers/pages/admin/AddInviteDriverPage";
import { DriverVerificationPage } from "@/features/drivers/pages/admin/DriverVerificationPage";
import { VehiclesListPage } from "@/features/fleet/pages/admin/VehiclesListPage";
import { VehicleDetailPage } from "@/features/fleet/pages/admin/VehicleDetailPage";
import { AddEditVehiclePage } from "@/features/fleet/pages/admin/AddEditVehiclePage";
import { MaintenanceLogsPage } from "@/features/fleet/pages/admin/MaintenanceLogsPage";
import { AddMaintenanceLogPage } from "@/features/fleet/pages/admin/AddMaintenanceLogPage";
import { PaymentsListPage } from "@/features/payments/pages/admin/PaymentsListPage";
import { PaymentDetailPage } from "@/features/payments/pages/admin/PaymentDetailPage";
import { PayoutsPage } from "@/features/payments/pages/admin/PayoutsPage";
import { RefundsPage } from "@/features/payments/pages/admin/RefundsPage";
import { ReportsOverviewPage } from "@/features/reports/pages/admin/ReportsOverviewPage";
import { RevenueReportPage } from "@/features/reports/pages/admin/RevenueReportPage";
import { DeliveriesReportPage } from "@/features/reports/pages/admin/DeliveriesReportPage";
import { FleetReportPage } from "@/features/reports/pages/admin/FleetReportPage";
import { DriversReportPage } from "@/features/reports/pages/admin/DriversReportPage";
import { CustomersReportPage } from "@/features/reports/pages/admin/CustomersReportPage";
import { SettingsPage } from "@/features/settings/pages/admin/SettingsPage";

// Shared messaging & notifications
import { InboxPage } from "@/features/messaging/pages/InboxPage";
import { ChatPage } from "@/features/messaging/pages/ChatPage";
import { NotificationsPage } from "@/features/notifications/pages/NotificationsPage";

// Customer pages (C-)
import { CustomerDashboardPage } from "@/features/dashboard/pages/customer/CustomerDashboardPage";
import { CreateShipmentWizardPage } from "@/features/shipments/pages/customer/CreateShipmentWizardPage";
import { TrackingListPage } from "@/features/tracking/pages/customer/TrackingListPage";
import { CustomerTrackingDetailPage } from "@/features/tracking/pages/customer/TrackingDetailPage";
import { ShipmentHistoryPage } from "@/features/shipments/pages/customer/ShipmentHistoryPage";
import { ShipmentHistoryDetailPage } from "@/features/shipments/pages/customer/ShipmentHistoryDetailPage";
import { CustomerPaymentsPage } from "@/features/payments/pages/customer/CustomerPaymentsPage";
import { CustomerPaymentDetailPage } from "@/features/payments/pages/customer/CustomerPaymentDetailPage";
import { CustomerProfilePage } from "@/features/profile/pages/customer/ProfilePage";
import { SavedAddressesPage } from "@/features/profile/pages/customer/SavedAddressesPage";
import { SecurityPage } from "@/features/profile/pages/customer/SecurityPage";
import { NotificationPrefsPage } from "@/features/profile/pages/customer/NotificationPrefsPage";

// Driver pages (D-)
import { DriverDashboardPage } from "@/features/dashboard/pages/driver/DriverDashboardPage";
import { JobsListPage } from "@/features/jobs/pages/driver/JobsListPage";
import { JobDetailPage } from "@/features/jobs/pages/driver/JobDetailPage";
import { TripsListPage } from "@/features/trips/pages/driver/TripsListPage";
import { TripDetailPage } from "@/features/trips/pages/driver/TripDetailPage";
import { RouteDetailsPage } from "@/features/trips/pages/driver/RouteDetailsPage";
import { NavigationPage } from "@/features/trips/pages/driver/NavigationPage";
import { DeliveryConfirmationPage } from "@/features/trips/pages/driver/DeliveryConfirmationPage";
import { EarningsPage } from "@/features/earnings/pages/driver/EarningsPage";
import { PayoutHistoryPage } from "@/features/earnings/pages/driver/PayoutHistoryPage";
import { DriverProfilePage } from "@/features/profile/pages/driver/DriverProfilePage";
import { DocumentsPage } from "@/features/profile/pages/driver/DocumentsPage";
import { DriverVehiclePage } from "@/features/profile/pages/driver/VehiclePage";
import { AvailabilityPage } from "@/features/profile/pages/driver/AvailabilityPage";

export const router = createBrowserRouter([
  {
    // Global error boundary — catches errors thrown in any child route
    errorElement: <GlobalErrorPage />,
    children: [
      // Root redirect
      {
        path: "/",
        element: <Navigate to="/login" replace />,
      },

      // ── Auth routes (S-01 … S-08) ───────────────────────────────────────────
      {
        element: <AuthLayout />,
        children: [
          { path: "/login", element: <LoginPage /> },
          { path: "/register", element: <RegisterPage /> },
          { path: "/forgot-password", element: <ForgotPasswordPage /> },
          { path: "/reset-password", element: <ResetPasswordPage /> },
          { path: "/verify-email", element: <VerifyEmailPage /> },
          { path: "/onboarding", element: <OnboardingPage /> },
          { path: "/invite", element: <InviteAcceptPage /> },
        ],
      },

      // ── Admin routes (A-) ─────────────────────────────────────────────────────
      {
        element: <RoleGuard allowedRole="admin" />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: "/admin", element: <AdminDashboardPage /> },

              // Shipments (A-02 … A-05)
              { path: "/admin/shipments", element: <ShipmentsListPage /> },
              { path: "/admin/shipments/new", element: <CreateShipmentPage /> },
              { path: "/admin/shipments/:id", element: <ShipmentDetailPage /> },
              { path: "/admin/shipments/:id/assign", element: <AssignDriverPage /> },

              // Tracking (A-06 … A-07)
              { path: "/admin/tracking", element: <FleetMapPage /> },
              { path: "/admin/tracking/:shipmentId", element: <TrackingDetailPage /> },

              // Orders (A-08 … A-10)
              { path: "/admin/orders", element: <OrdersListPage /> },
              { path: "/admin/orders/:id", element: <OrderDetailPage /> },
              { path: "/admin/orders/:id/invoice", element: <InvoicePage /> },

              // Customers (A-11 … A-13)
              { path: "/admin/customers", element: <CustomersListPage /> },
              { path: "/admin/customers/new", element: <AddEditCustomerPage /> },
              { path: "/admin/customers/:id", element: <CustomerDetailPage /> },
              { path: "/admin/customers/:id/edit", element: <AddEditCustomerPage /> },

              // Drivers (A-14 … A-17)
              { path: "/admin/drivers", element: <DriversListPage /> },
              { path: "/admin/drivers/new", element: <AddInviteDriverPage /> },
              { path: "/admin/drivers/:id", element: <DriverDetailPage /> },
              { path: "/admin/drivers/:id/edit", element: <AddInviteDriverPage /> },
              { path: "/admin/drivers/:id/verify", element: <DriverVerificationPage /> },

              // Fleet (A-18 … A-23)
              { path: "/admin/fleet", element: <VehiclesListPage /> },
              { path: "/admin/fleet/new", element: <AddEditVehiclePage /> },
              { path: "/admin/fleet/maintenance", element: <MaintenanceLogsPage /> },
              { path: "/admin/fleet/maintenance/new", element: <AddMaintenanceLogPage /> },
              { path: "/admin/fleet/:id", element: <VehicleDetailPage /> },
              { path: "/admin/fleet/:id/edit", element: <AddEditVehiclePage /> },

              // Payments (A-24 … A-27)
              { path: "/admin/payments", element: <PaymentsListPage /> },
              { path: "/admin/payments/payouts", element: <PayoutsPage /> },
              { path: "/admin/payments/refunds", element: <RefundsPage /> },
              { path: "/admin/payments/:id", element: <PaymentDetailPage /> },

              // Reports (A-28 … A-33)
              { path: "/admin/reports", element: <ReportsOverviewPage /> },
              { path: "/admin/reports/revenue", element: <RevenueReportPage /> },
              { path: "/admin/reports/deliveries", element: <DeliveriesReportPage /> },
              { path: "/admin/reports/fleet", element: <FleetReportPage /> },
              { path: "/admin/reports/drivers", element: <DriversReportPage /> },
              { path: "/admin/reports/customers", element: <CustomersReportPage /> },

              // Messages & notifications
              { path: "/admin/messages", element: <InboxPage /> },
              { path: "/admin/messages/:conversationId", element: <ChatPage /> },
              { path: "/admin/notifications", element: <NotificationsPage /> },

              // Settings (A-34)
              { path: "/admin/settings", element: <SettingsPage /> },
              { path: "/admin/settings/:section", element: <SettingsPage /> },
            ],
          },
        ],
      },

      // ── Customer routes (C-) ──────────────────────────────────────────────────
      {
        element: <RoleGuard allowedRole="customer" />,
        children: [
          {
            element: <CustomerLayout />,
            children: [
              { path: "/app", element: <CustomerDashboardPage /> },

              // Shipment wizard (C-02)
              { path: "/app/shipments/new", element: <CreateShipmentWizardPage /> },

              // Tracking (C-03 … C-04)
              { path: "/app/tracking", element: <TrackingListPage /> },
              { path: "/app/tracking/:id", element: <CustomerTrackingDetailPage /> },

              // History (C-05 … C-06)
              { path: "/app/history", element: <ShipmentHistoryPage /> },
              { path: "/app/history/:id", element: <ShipmentHistoryDetailPage /> },

              // Payments (C-07 … C-08)
              { path: "/app/payments", element: <CustomerPaymentsPage /> },
              { path: "/app/payments/:id", element: <CustomerPaymentDetailPage /> },

              // Messages & notifications
              { path: "/app/messages", element: <InboxPage /> },
              { path: "/app/messages/:conversationId", element: <ChatPage /> },
              { path: "/app/notifications", element: <NotificationsPage /> },

              // Profile (C-10 … C-13)
              { path: "/app/profile", element: <CustomerProfilePage /> },
              { path: "/app/profile/addresses", element: <SavedAddressesPage /> },
              { path: "/app/profile/security", element: <SecurityPage /> },
              { path: "/app/profile/notifications", element: <NotificationPrefsPage /> },
            ],
          },
        ],
      },

      // ── Driver routes (D-) ────────────────────────────────────────────────────
      {
        element: <RoleGuard allowedRole="driver" />,
        children: [
          {
            element: <DriverLayout />,
            children: [
              { path: "/driver", element: <DriverDashboardPage /> },

              // Jobs (D-02 … D-03)
              { path: "/driver/jobs", element: <JobsListPage /> },
              { path: "/driver/jobs/:id", element: <JobDetailPage /> },

              // Trips (D-04 … D-08)
              { path: "/driver/trips", element: <TripsListPage /> },
              { path: "/driver/trips/:id", element: <TripDetailPage /> },
              { path: "/driver/trips/:id/route", element: <RouteDetailsPage /> },
              { path: "/driver/trips/:id/navigate", element: <NavigationPage /> },
              { path: "/driver/trips/:id/confirm", element: <DeliveryConfirmationPage /> },

              // Messages & notifications
              { path: "/driver/messages", element: <InboxPage /> },
              { path: "/driver/messages/:conversationId", element: <ChatPage /> },
              { path: "/driver/notifications", element: <NotificationsPage /> },

              // Earnings (D-09 … D-10)
              { path: "/driver/earnings", element: <EarningsPage /> },
              { path: "/driver/earnings/payouts", element: <PayoutHistoryPage /> },

              // Profile (D-12 … D-15)
              { path: "/driver/profile", element: <DriverProfilePage /> },
              { path: "/driver/profile/documents", element: <DocumentsPage /> },
              { path: "/driver/profile/vehicle", element: <DriverVehiclePage /> },
              { path: "/driver/profile/availability", element: <AvailabilityPage /> },
            ],
          },
        ],
      },

      // ── 404 ─────────────────────────────────────────────────────────────────
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
