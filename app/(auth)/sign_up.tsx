import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { ArrowRight, Eye, EyeOff, Lock, Mail, Phone, User as UserIcon } from 'lucide-react-native'; // Renommé User pour éviter le conflit
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SignUpScreen() {
    const { t } = useTranslation();
    const { signUp, isLoading } = useAuth();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.firstName) newErrors.firstName = 'First name is required';
        if (!formData.lastName) newErrors.lastName = 'Last name is required';

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters long';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Confirm password is required';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        
        // Phone number is optional, but if provided, validate format (basic example)
        if (formData.phone && !/^\+?[0-9]{7,15}$/.test(formData.phone)) {
            newErrors.phone = 'Please enter a valid phone number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSignUp = async () => {
        if (!validateForm()) return;

        const { error } = await signUp({
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            role: 'user',
        });

        if (error) {
            Alert.alert('Sign Up Failed', error);
        } else {
            Alert.alert('Sign Up Successful', 'Please check your email to verify your account.');
            router.replace('/(auth)/sign_in'); // Redirige vers la page de connexion après l'inscription
        }
    };

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
                    <Text style={styles.headerTitle}>{t('auth.signUp')}</Text>
                    <Text style={styles.headerSubtitle}>Create your account to get started</Text>
                </LinearGradient>

                {/* Form */}
                <View style={styles.formContainer}>
                    <View style={styles.form}>
                        {/* First Name Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('profile.firstName')}</Text>
                            <View style={[styles.inputContainer, errors.firstName && styles.inputError]}>
                                <UserIcon size={20} color={Colors.gray} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your first name"
                                    placeholderTextColor={Colors.gray}
                                    value={formData.firstName}
                                    onChangeText={(text) => {
                                        setFormData({ ...formData, firstName: text });
                                        if (errors.firstName) setErrors({ ...errors, firstName: '' });
                                    }}
                                    autoCorrect={false}
                                />
                            </View>
                            {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
                        </View>

                        {/* Last Name Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('profile.lastName')}</Text>
                            <View style={[styles.inputContainer, errors.lastName && styles.inputError]}>
                                <UserIcon size={20} color={Colors.gray} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your last name"
                                    placeholderTextColor={Colors.gray}
                                    value={formData.lastName}
                                    onChangeText={(text) => {
                                        setFormData({ ...formData, lastName: text });
                                        if (errors.lastName) setErrors({ ...errors, lastName: '' });
                                    }}
                                    autoCorrect={false}
                                />
                            </View>
                            {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
                        </View>

                        {/* Email Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('auth.email')}</Text>
                            <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                                <Mail size={20} color={Colors.gray} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your email"
                                    placeholderTextColor={Colors.gray}
                                    value={formData.email}
                                    onChangeText={(text) => {
                                        setFormData({ ...formData, email: text });
                                        if (errors.email) setErrors({ ...errors, email: '' });
                                    }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>
                            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                        </View>

                        {/* Phone Input (Optional) */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('profile.phone')} (Optional)</Text>
                            <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
                                <Phone size={20} color={Colors.gray} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your phone number"
                                    placeholderTextColor={Colors.gray}
                                    value={formData.phone}
                                    onChangeText={(text) => {
                                        setFormData({ ...formData, phone: text });
                                        if (errors.phone) setErrors({ ...errors, phone: '' });
                                    }}
                                    keyboardType="phone-pad"
                                />
                            </View>
                            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('auth.password')}</Text>
                            <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                                <Lock size={20} color={Colors.gray} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your password"
                                    placeholderTextColor={Colors.gray}
                                    value={formData.password}
                                    onChangeText={(text) => {
                                        setFormData({ ...formData, password: text });
                                        if (errors.password) setErrors({ ...errors, password: '' });
                                    }}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.eyeIcon}
                                >
                                    {showPassword ? (
                                        <EyeOff size={20} color={Colors.gray} />
                                    ) : (
                                        <Eye size={20} color={Colors.gray} />
                                    )}
                                </TouchableOpacity>
                            </View>
                            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                        </View>

                        {/* Confirm Password Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('auth.confirmPassword')}</Text>
                            <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
                                <Lock size={20} color={Colors.gray} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirm your password"
                                    placeholderTextColor={Colors.gray}
                                    value={formData.confirmPassword}
                                    onChangeText={(text) => {
                                        setFormData({ ...formData, confirmPassword: text });
                                        if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                                    }}
                                    secureTextEntry={!showConfirmPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={styles.eyeIcon}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff size={20} color={Colors.gray} />
                                    ) : (
                                        <Eye size={20} color={Colors.gray} />
                                    )}
                                </TouchableOpacity>
                            </View>
                            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
                        </View>

                        {/* Sign Up Button */}
                        <TouchableOpacity
                            style={[styles.signInButton, isLoading && styles.buttonDisabled]}
                            onPress={handleSignUp}
                            disabled={isLoading}
                        >
                            <LinearGradient
                                colors={[Colors.blue, Colors.skyblue]}
                                style={styles.buttonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.signInButtonText}>
                                    {isLoading ? 'Signing Up...' : t('auth.signUp')}
                                </Text>
                                {!isLoading && <ArrowRight size={20} color={Colors.white} />}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Sign In Link */}
                        <View style={styles.signUpContainer}>
                            <Text style={styles.signUpText}>{t('auth.alreadyHaveAccount')} </Text>
                            {/* Redirection vers la page de connexion */}
                            <Link href="/(auth)/sign_in" asChild>
                                <TouchableOpacity>
                                    <Text style={styles.signUpLink}>{t('auth.signIn')}</Text>
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
        marginBottom: 24,
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
    eyeIcon: {
        padding: 4,
    },
    errorText: {
        fontSize: 14,
        color: Colors.error,
        marginTop: 4,
        fontFamily: 'Inter-Regular',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 32,
    },
    forgotPasswordText: {
        fontSize: 14,
        color: Colors.blue,
        fontWeight: '600',
        fontFamily: 'Inter-SemiBold',
    },
    signInButton: {
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
    signInButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.white,
        fontFamily: 'Inter-Bold',
    },
    signUpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 'auto',
        paddingBottom: 32,
    },
    signUpText: {
        fontSize: 16,
        color: Colors.gray,
        fontFamily: 'Inter-Regular',
    },
    signUpLink: {
        fontSize: 16,
        color: Colors.blue,
        fontWeight: '600',
        fontFamily: 'Inter-SemiBold',
    },
});
