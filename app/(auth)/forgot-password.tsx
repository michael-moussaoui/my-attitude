/* eslint-disable react/no-unescaped-entities */
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { ArrowLeft, Mail, Send } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function ForgotPasswordScreen() {
    const { t } = useTranslation();
    const { resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [error, setError] = useState('');

    const validateEmail = (email: string) => {
        return /\S+@\S+\.\S+/.test(email);
    };

    const handleResetPassword = async () => {
        if (!email) {
            setError('Email is required');
            return;
        }

        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setIsLoading(true);
        setError('');

        const { error: resetError } = await resetPassword({ email });

        setIsLoading(false);

        if (resetError) {
            setError(resetError);
        } else {
            setEmailSent(true);
        }
    };

    if (emailSent) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={[Colors.blue, Colors.skyblue]}
                    style={styles.header}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <ArrowLeft size={24} color={Colors.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Check Your Email</Text>
                    <Text style={styles.headerSubtitle}>
                        We've sent password reset instructions to your email
                    </Text>
                </LinearGradient>

                <View style={styles.formContainer}>
                    <View style={styles.successContainer}>
                        <View style={styles.successIcon}>
                            <Send size={48} color={Colors.blue} />
                        </View>
                        <Text style={styles.successTitle}>Email Sent!</Text>
                        <Text style={styles.successMessage}>
                            We've sent a password reset link to{'\n'}
                            <Text style={styles.emailText}>{email}</Text>
                        </Text>
                        <Text style={styles.instructionText}>
                            Please check your email and follow the instructions to reset your password.
                        </Text>

                        <TouchableOpacity
                            style={styles.resendButton}
                            onPress={() => {
                                setEmailSent(false);
                                setEmail('');
                            }}
                        >
                            <Text style={styles.resendButtonText}>Send Another Email</Text>
                        </TouchableOpacity>

                        {/* CORRECTION ICI : Utilisation de la route correcte pour la page de connexion */}
                        <Link href="/(auth)/sign_in" asChild>
                            <TouchableOpacity style={styles.backToSignInButton}>
                                <LinearGradient
                                    colors={[Colors.blue, Colors.skyblue]}
                                    style={styles.buttonGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Text style={styles.backToSignInButtonText}>Back to Sign In</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <LinearGradient
                    colors={[Colors.blue, Colors.skyblue]}
                    style={styles.header}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <ArrowLeft size={24} color={Colors.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Reset Password</Text>
                    <Text style={styles.headerSubtitle}>
                        Enter your email address and we'll send you instructions to reset your password
                    </Text>
                </LinearGradient>

                {/* Form */}
                <View style={styles.formContainer}>
                    <View style={styles.form}>
                        {/* Email Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('auth.email')}</Text>
                            <View style={[styles.inputContainer, error && styles.inputError]}>
                                <Mail size={20} color={Colors.gray} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your email address"
                                    placeholderTextColor={Colors.gray}
                                    value={email}
                                    onChangeText={(text) => {
                                        setEmail(text);
                                        if (error) setError('');
                                    }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoFocus
                                />
                            </View>
                            {error && <Text style={styles.errorText}>{error}</Text>}
                        </View>

                        {/* Reset Button */}
                        <TouchableOpacity
                            style={[styles.resetButton, isLoading && styles.buttonDisabled]}
                            onPress={handleResetPassword}
                            disabled={isLoading}
                        >
                            <LinearGradient
                                colors={[Colors.blue, Colors.skyblue]}
                                style={styles.buttonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.resetButtonText}>
                                    {isLoading ? 'Sending...' : 'Send Reset Instructions'}
                                </Text>
                                {!isLoading && <Send size={20} color={Colors.white} />}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Back to Sign In */}
                        <View style={styles.signInContainer}>
                            <Text style={styles.signInText}>Remember your password? </Text>
                            {/* CORRECTION ICI : Utilisation de la route correcte pour la page de connexion */}
                            <Link href="/(auth)/sign_in" asChild>
                                <TouchableOpacity>
                                    <Text style={styles.signInLink}>{t('auth.signIn')}</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        paddingTop: 80,
        paddingBottom: 40,
        paddingHorizontal: 24,
        alignItems: 'center',
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        top: 80,
        left: 24,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.white,
        marginBottom: 8,
        fontFamily: 'Inter-Bold',
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        lineHeight: 24,
        fontFamily: 'Inter-Regular',
    },
    formContainer: {
        flex: 1,
        backgroundColor: Colors.white,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        marginTop: -20,
        paddingTop: 32,
        paddingHorizontal: 24,
    },
    form: {
        flex: 1,
    },
    inputGroup: {
        marginBottom: 32,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.darkGray,
        marginBottom: 8,
        fontFamily: 'Inter-SemiBold',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.lightGray,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    inputError: {
        borderColor: Colors.error,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: Colors.darkGray,
        paddingVertical: 16,
        fontFamily: 'Inter-Regular',
    },
    errorText: {
        fontSize: 14,
        color: Colors.error,
        marginTop: 4,
        fontFamily: 'Inter-Regular',
    },
    resetButton: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 8,
    },
    resetButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.white,
        fontFamily: 'Inter-Bold',
    },
    signInContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 'auto',
        paddingBottom: 32,
    },
    signInText: {
        fontSize: 16,
        color: Colors.gray,
        fontFamily: 'Inter-Regular',
    },
    signInLink: {
        fontSize: 16,
        color: Colors.blue,
        fontWeight: '600',
        fontFamily: 'Inter-SemiBold',
    },
    successContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    successIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.blue1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.darkGray,
        marginBottom: 16,
        fontFamily: 'Inter-Bold',
    },
    successMessage: {
        fontSize: 16,
        color: Colors.gray,
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 24,
        fontFamily: 'Inter-Regular',
    },
    emailText: {
        fontWeight: '600',
        color: Colors.blue,
        fontFamily: 'Inter-SemiBold',
    },
    instructionText: {
        fontSize: 14,
        color: Colors.gray,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 20,
        fontFamily: 'Inter-Regular',
    },
    resendButton: {
        marginBottom: 16,
    },
    resendButtonText: {
        fontSize: 16,
        color: Colors.blue,
        fontWeight: '600',
        fontFamily: 'Inter-SemiBold',
    },
    backToSignInButton: {
        borderRadius: 16,
        overflow: 'hidden',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    backToSignInButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.white,
        fontFamily: 'Inter-Bold',
    },
});
