export interface User {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    dateOfBirth?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
}
export interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

export interface SignUpData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
}

export interface SignInData {
    email: string;
    password: string;
}

export interface ResetPasswordData {
    email: string;
}

export interface UpdateProfileData {
    firstName?: string;
    lastName?: string;
    phone?: string;
    dateOfBirth?: string;
}