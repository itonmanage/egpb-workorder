/**
 * Format role name for display
 * Converts role enum values to human-readable format
 */
export const formatRoleName = (role: string): string => {
    // Replace underscores with spaces and convert to title case
    return role
        .split('_')
        .map(word => word.charAt(0) + word.slice(1).toLowerCase())
        .join(' ');
};

/**
 * Role display names mapping
 */
export const ROLE_DISPLAY_NAMES: Record<string, string> = {
    'ADMIN': 'Admin',
    'IT_ADMIN': 'IT Admin',
    'ENGINEER_ADMIN': 'Engineer Admin',
    'USER': 'User',
    'FRONT_OFFICE': 'Front Office',
    'BACK_OFFICE': 'Back Office',
    'ACCOUNTING': 'Accounting',
    'ENGINEER': 'Engineer',
};

/**
 * Get display name for role
 */
export const getRoleDisplayName = (role: string): string => {
    return ROLE_DISPLAY_NAMES[role] || formatRoleName(role);
};
