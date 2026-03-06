#!/bin/bash
# Deployment Verification Script for Pact Admin System
# Run this after deployment to verify all changes are in place

echo "🔍 Pact Admin System - Deployment Verification"
echo "==============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} File exists: $1"
    else
        echo -e "${RED}✗${NC} File missing: $1"
        ((ERRORS++))
    fi
}

# Function to check string in file
check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Found '$2' in $1"
    else
        echo -e "${RED}✗${NC} Missing '$2' in $1"
        ((ERRORS++))
    fi
}

echo "📁 Checking Files..."
echo "-------------------"

# Core admin files
check_file "src/lib/auth/admin-utils.ts"
check_file "src/app/admin/actions.ts"
check_file "src/app/admin/page.tsx"
check_file "src/app/admin/layout.tsx"
check_file "src/lib/auth/roles.ts"
check_file "src/lib/supabase/middleware.ts"

echo ""
echo "🔐 Checking Admin Utilities..."
echo "------------------------------"

check_content "src/lib/auth/admin-utils.ts" "verifyAdminAccess"
check_content "src/lib/auth/admin-utils.ts" "getAdminStats"
check_content "src/lib/auth/admin-utils.ts" "isAdmin"

echo ""
echo "⚙️ Checking Admin Actions..."
echo "----------------------------"

check_content "src/app/admin/actions.ts" "updateUserRole"
check_content "src/app/admin/actions.ts" "verifyFarmer"
check_content "src/app/admin/actions.ts" "releaseFunds"
check_content "src/app/admin/actions.ts" "resolveDispute"

echo ""
echo "🛣️ Checking Role Routing..."
echo "----------------------------"

check_content "src/lib/auth/roles.ts" "case 'admin': return '/admin'"
check_content "src/lib/supabase/middleware.ts" "role"

echo ""
echo "🏠 Checking Layouts..."
echo "---------------------"

check_content "src/app/admin/layout.tsx" "role !== 'admin'"
check_content "src/app/farmer/layout.tsx" "role !== 'farmer'"
check_content "src/app/buyer/layout.tsx" "role"

echo ""
echo "📚 Checking Documentation..."
echo "-----------------------------"

check_file "ROLE_BASED_ACCESS_CONTROL_SUMMARY.md"
check_file "ADMIN_IMPLEMENTATION.md"
check_file "ADMIN_TESTING_GUIDE.md"
check_file "IMPLEMENTATION_CHECKLIST.md"
check_file "FILES_MODIFIED.md"
check_file "FINAL_STATUS_REPORT.md"
check_file "DOCUMENTATION_INDEX.md"

echo ""
echo "═════════════════════════════════════════════════════"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All verification checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review DOCUMENTATION_INDEX.md for reading guide"
    echo "2. Run the test scenarios from ADMIN_TESTING_GUIDE.md"
    echo "3. Verify in production with test admin account"
    echo "4. Monitor logs for any issues"
else
    echo -e "${RED}✗ Found $ERRORS error(s)${NC}"
    echo ""
    echo "Please fix the above issues before deployment."
fi

echo ""
echo "Status: $(date)"
