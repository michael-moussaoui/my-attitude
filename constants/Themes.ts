import { Colors } from './Colors';

export const lightTheme = {
    colors: {
        primary: Colors.blue,
        secondary: Colors.skyblue,
        background: Colors.background,
        surface: Colors.white,
        text: Colors.black,
        textSecondary: Colors.gray,
        border: Colors.lightGray,
        accent: Colors.blue1,
        success: Colors.success,
        warning: Colors.warning,
        error: Colors.error,
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
    },
    borderRadius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
    },
    typography: {
        h1: {
            fontSize: 32,
            fontWeight: 'bold' as const,
            lineHeight: 40,
        },
        h2: {
            fontSize: 24,
            fontWeight: 'bold' as const,
            lineHeight: 32,
        },
        h3: {
            fontSize: 20,
            fontWeight: '600' as const,
            lineHeight: 28,
        },
        body: {
            fontSize: 16,
            fontWeight: 'normal' as const,
            lineHeight: 24,
        },
        caption: {
            fontSize: 14,
            fontWeight: 'normal' as const,
            lineHeight: 20,
        },
    },
};

export type Theme = typeof lightTheme;