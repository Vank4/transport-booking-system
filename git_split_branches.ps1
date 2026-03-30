# Git Split Branches Script
$ErrorActionPreference = "Stop"

function Commit-Branch {
    param (
        [string]$BranchName,
        [string[]]$Files,
        [string]$Message
    )
    Write-Host "--- Processing Branch: $BranchName ---" -ForegroundColor Cyan
    
    # Quay về develop để tạo nhánh mới từ gốc sạch (hoặc trạng thái hiện tại)
    git checkout develop
    
    # Tạo và chuyển sang nhánh mới
    git checkout -b $BranchName
    
    foreach ($file in $Files) {
        if (Test-Path $file) {
            git add $file
            Write-Host "Added: $file"
        } else {
            Write-Warning "File not found: $file"
        }
    }
    
    git commit -m $Message
    git push origin $BranchName
    
    # Quay lại develop
    git checkout develop
}

# --- Nhóm 1: UI Dashboard ---
$uiFiles = @(
    "frontend/src/app/admin/layout.tsx",
    "frontend/src/app/admin/loading.tsx",
    "frontend/src/app/admin/page.tsx",
    "frontend/src/components/admin/AdminSidebar.tsx",
    "frontend/src/components/admin/AdminHeader.tsx",
    "frontend/src/components/admin/ToastProvider.tsx",
    "frontend/src/lib/utils.ts",
    "frontend/tailwind.config.ts"
)
$uiMsg = "feat(admin): redesign admin shell with collapsible sidebar and smart header`n`n- Implement accordion navigation groups with auto-expand for active routes`n- Add dynamic page title in header based on current pathname`n- Introduce user profile dropdown with logout functionality`n- Integrate global ToastProvider for consistent admin-wide notifications`n- Add real-time year selector and CSV export to reporting dashboard`n- Upgrade admin layout to enforce role-based access control guard"

Commit-Branch -BranchName "feat/admin-dashboard-ui" -Files $uiFiles -Message $uiMsg

# --- Nhóm 2: Booking Management ---
$bookingFiles = @(
    "frontend/src/app/admin/bookings/page.tsx",
    "frontend/src/app/admin/bookings/[id]/page.tsx",
    "frontend/src/app/admin/tickets/page.tsx",
    "frontend/src/app/admin/tickets/[id]/page.tsx",
    "backend/src/controllers/adminBookings.controller.js",
    "backend/src/routes/adminBookings.routes.js",
    "backend/src/routes/adminDashboard.routes.js"
)
$bookingMsg = "feat(admin/bookings): implement master-detail booking dashboard and ticket management`n`n- Redesign booking list with master-detail sliding drawer pattern`n- Add real-time status update for bookings (CONFIRMED, CANCELLED, EXPIRED)`n- Implement seat release logic when booking is cancelled or expired`n- Remove hard-delete from ticket management to preserve financial audit trail`n- Replace native alert/confirm dialogs with Toast notifications`n- Add monthly revenue aggregation endpoint for strategic reporting dashboard"

Commit-Branch -BranchName "feat/admin-booking-management" -Files $bookingFiles -Message $bookingMsg

# --- Nhóm 3: Promotions & Reporting ---
$promoFiles = @(
    "frontend/src/app/admin/vouchers/page.tsx",
    "frontend/src/app/admin/vouchers/[id]/page.tsx",
    "frontend/src/app/admin/reports/page.tsx",
    "backend/src/controllers/vouchers.controller.js",
    "backend/src/routes/vouchers.routes.js",
    "backend/src/validators/report.validator.js"
)
$promoMsg = "feat(admin/promotions): add voucher lifecycle management and strategic reporting`n`n- Add voucher CRUD with status toggle (active/inactive)`n- Implement safe-delete logic: deactivates voucher if bookings exist`n- Replace window.confirm with custom confirmation modal for all delete actions`n- Integrate Toast notifications for all voucher CRUD operations`n- Add strategic reporting page with monthly revenue line chart (SVG)`n- Implement transport-type distribution donut chart and top-5 routes bar chart`n- Add CSV export with structured summary, monthly table, and top routes section"

Commit-Branch -BranchName "feat/admin-promotions-reporting" -Files $promoFiles -Message $promoMsg

# --- Nhóm 4: Auth & Security ---
$authFiles = @(
    "frontend/src/middleware.ts",
    "frontend/src/lib/auth.ts",
    "frontend/src/app/auth/login/page.tsx",
    "backend/src/controllers/users.controller.js",
    "backend/src/routes/user.routes.js",
    "backend/src/validators/user.validator.js",
    "backend/src/models/users.model.js",
    "backend/src/services/users.service.js"
)
$authMsg = "feat(auth): implement role-based access control and admin route protection`n`n- Add Next.js edge middleware to guard /admin/* routes`n- Redirect unauthenticated users to /auth/login with ?redirect= param`n- Redirect non-admin authenticated users to home page`n- Persist auth tokens and user role to cookies for edge-readable access`n- Clear cookies on logout to invalidate middleware-level session`n- Auto-redirect ADMIN role users to /admin dashboard after login`n- Add client-side auth guard in admin layout as secondary protection layer"

Commit-Branch -BranchName "feat/admin-auth-security" -Files $authFiles -Message $authMsg

# --- Nhóm 5: Transport Catalog (All remaining files) ---
Write-Host "--- Processing Remaining Files for Transport Catalog ---" -ForegroundColor Cyan
git checkout develop
git checkout -b feat/admin-transport-catalog
git add . 
git commit -m "feat(admin/transport): implement full CRUD for aviation and railway catalog`n`n- Add complete airline and airport management with logo upload support`n- Implement flight schedule management with route and time validation`n- Add flight fare configuration with cabin class and promotional pricing`n- Implement train, station, carriage, and seat management modules`n- Add train trip scheduling with departure/arrival station linking`n- Centralize error handling with AppError class and ApiResponse utility`n- Add request validation middleware using express-validator"
git push origin feat/admin-transport-catalog
git checkout develop

Write-Host "=== ALL BRANCHES PUSHED SUCCESSFULLY ===" -ForegroundColor Green
