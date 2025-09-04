export interface User {
    id: string;
    uid?: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    dateOfBirth?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    role: 'user' | 'admin';
    photoUrl?: string | null;
    isAthlete?: boolean | null | undefined;
    sport?: string | null | undefined;
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
    role: 'user' | 'admin';
    isAthlete?: boolean;
    sport?: string;
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
    photoUrl?: string;
    isAthlete?: boolean;
    sport?: string,
}