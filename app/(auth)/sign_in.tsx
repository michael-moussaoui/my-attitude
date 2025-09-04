import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient'; // Gardé pour référence, mais non utilisé dans le header
import { Link, router } from 'expo-router';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
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
    View, // Assurez-vous que View est importé
} from 'react-native';

export default function SignInScreen() {
    const { t } = useTranslation();
    const { signIn, isLoading } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.email) {
            newErrors.email = t('auth.emailRequired');
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = t('auth.invalidEmail');
        }

        if (!formData.password) {
            newErrors.password = t('auth.passwordRequired');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSignIn = async () => {
        if (!validateForm()) return;

        const { error } = await signIn(formData);

        if (error) {
            Alert.alert(t('auth.signInFailed'), error);
        } else {
            router.replace('/(tabs)');
            // router.replace('/welcome');
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header - TEMPORAIREMENT SANS LinearGradient */}
                <View
                    style={[styles.header, { backgroundColor: Colors.blue }]} // Utilisation d'une couleur unie
                >
                    {/* <Text style={styles.headerTitle}>{t('auth.welcomeBackTitle')}</Text> */}
                    <View>
                                  <Image
                                    style={styles.image}
                                    source={require('../../assets/images/logo1.png')} 
                                    contentFit="contain" 
                                    transition={1000}
                                  />
                                </View>
                    <Text style={styles.headerSubtitle}>{t('auth.welcomeBackSubtitle')}</Text>
                </View>

                {/* Form */}
                <View style={styles.formContainer}>
                    <View style={styles.form}>
                        {/* Email Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('auth.email')}</Text>
                            <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                                <Mail size={20} color={Colors.gray} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('auth.enterYourEmailPlaceholder')}
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

                        {/* Password Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('auth.password')}</Text>
                            <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                                <Lock size={20} color={Colors.gray} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('auth.enterYourPasswordPlaceholder')}
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

                        {/* Forgot Password Link */}
                        <Link href="/(auth)/forgot-password" asChild>
                            <TouchableOpacity style={styles.forgotPassword}>
                                <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
                            </TouchableOpacity>
                        </Link>

                        {/* Sign In Button (LinearGradient conservé ici pour le test) */}
                        <TouchableOpacity
                            style={[styles.signInButton, isLoading && styles.buttonDisabled]}
                            onPress={handleSignIn}
                            disabled={isLoading}
                        >
                            <LinearGradient
                                colors={[Colors.blue, Colors.skyblue]}
                                style={styles.buttonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.signInButtonText}>
                                    {isLoading ? t('auth.signingIn') : t('auth.signIn')}
                                </Text>
                                {!isLoading && <ArrowRight size={20} color={Colors.white} />}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Sign Up Link */}
                        <View style={styles.signUpContainer}>
                            <Text style={styles.signUpText}>{t('auth.dontHaveAccount')} </Text>
                            <Link href="/(auth)/sign_up" asChild> 
                                <TouchableOpacity>
                                    <Text style={styles.signUpLink}>{t('auth.signUp')}</Text>
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
    image: {
      width: 150, 
      height: 100, 
      alignSelf: 'flex-start', 
      top: -30,
      left: -10
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


/*****************************************/
/*****************************************/
/*****************************************/

// import { Colors } from '@/constants/Colors';
// import { useAuth } from '@/contexts/AuthContext';
// import auth from '@react-native-firebase/auth'; // Importation pour Firebase Auth
// import { GoogleSignin } from '@react-native-google-signin/google-signin'; // Importation pour Google Sign-In
// import { Image } from 'expo-image';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Link, router } from 'expo-router';
// import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
// import React, { useState } from 'react';
// import { useTranslation } from 'react-i18next';
// import {
//     Alert,
//     KeyboardAvoidingView,
//     Platform,
//     ScrollView,
//     StyleSheet,
//     Text,
//     TextInput,
//     TouchableOpacity,
//     View,
// } from 'react-native';

// export default function SignInScreen() {
//   const { t } = useTranslation();
//   const { signIn, isLoading } = useAuth();
//   const [formData, setFormData] = useState({
//     email: '',
//     password: '',
//   });
//   const [showPassword, setShowPassword] = useState(false);
//   const [errors, setErrors] = useState<{ [key: string]: string }>({});

//   // Configuration Google Sign-In
//   React.useEffect(() => {
//     GoogleSignin.configure({
//       webClientId: '527078342861-r9st4q8r520cathnhifeh0i953e6b3s7.apps.googleusercontent.com', 
//     });
//   }, []);

//   const validateForm = () => {
//     const newErrors: { [key: string]: string } = {};

//     if (!formData.email) {
//       newErrors.email = t('auth.emailRequired');
//     } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
//       newErrors.email = t('auth.invalidEmail');
//     }

//     if (!formData.password) {
//       newErrors.password = t('auth.passwordRequired');
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSignIn = async () => {
//     if (!validateForm()) return;

//     const { error } = await signIn(formData);

//     if (error) {
//       Alert.alert(t('auth.signInFailed'), error);
//     } else {
//       router.replace('/(tabs)');
//     }
//   };

//   const onGoogleButtonPress = async () => {
//     try {
//       await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
//       const signInResponse = await GoogleSignin.signIn();
//       const idToken = (signInResponse as any).idToken;
//       const googleCredential = auth.GoogleAuthProvider.credential(idToken);
//       await auth().signInWithCredential(googleCredential);
//       router.replace('/(tabs)');
//     } catch (error: any) {
//       console.error('Google Sign-In Error:', error);
//       Alert.alert(t('auth.signInFailed'), 'Google Sign-In failed. Please try again.');
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       style={styles.container}
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//     >
//       <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
//         {/* Header - TEMPORAIREMENT SANS LinearGradient */}
//         <View style={[styles.header, { backgroundColor: Colors.blue }]}>
//           <View>
//             <Image
//               style={styles.image}
//               source={require('../../assets/images/logo1.png')}
//               contentFit="contain"
//               transition={1000}
//             />
//           </View>
//           <Text style={styles.headerSubtitle}>{t('auth.welcomeBackSubtitle')}</Text>
//         </View>

//         {/* Form */}
//         <View style={styles.formContainer}>
//           <View style={styles.form}>
//             {/* Email Input */}
//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>{t('auth.email')}</Text>
//               <View style={[styles.inputContainer, errors.email && styles.inputError]}>
//                 <Mail size={20} color={Colors.gray} style={styles.inputIcon} />
//                 <TextInput
//                   style={styles.input}
//                   placeholder={t('auth.enterYourEmailPlaceholder')}
//                   placeholderTextColor={Colors.gray}
//                   value={formData.email}
//                   onChangeText={(text) => {
//                     setFormData({ ...formData, email: text });
//                     if (errors.email) setErrors({ ...errors, email: '' });
//                   }}
//                   keyboardType="email-address"
//                   autoCapitalize="none"
//                   autoCorrect={false}
//                 />
//               </View>
//               {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
//             </View>

//             {/* Password Input */}
//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>{t('auth.password')}</Text>
//               <View style={[styles.inputContainer, errors.password && styles.inputError]}>
//                 <Lock size={20} color={Colors.gray} style={styles.inputIcon} />
//                 <TextInput
//                   style={styles.input}
//                   placeholder={t('auth.enterYourPasswordPlaceholder')}
//                   placeholderTextColor={Colors.gray}
//                   value={formData.password}
//                   onChangeText={(text) => {
//                     setFormData({ ...formData, password: text });
//                     if (errors.password) setErrors({ ...errors, password: '' });
//                   }}
//                   secureTextEntry={!showPassword}
//                   autoCapitalize="none"
//                   autoCorrect={false}
//                 />
//                 <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
//                   {showPassword ? <EyeOff size={20} color={Colors.gray} /> : <Eye size={20} color={Colors.gray} />}
//                 </TouchableOpacity>
//               </View>
//               {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
//             </View>

//             {/* Forgot Password Link */}
//             <Link href="/(auth)/forgot-password" asChild>
//               <TouchableOpacity style={styles.forgotPassword}>
//                 <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
//               </TouchableOpacity>
//             </Link>

//             {/* Google Sign-In Button */}
//             <TouchableOpacity
//               style={[styles.signInButton, isLoading && styles.buttonDisabled]}
//               onPress={onGoogleButtonPress}
//               disabled={isLoading}
//             >
//               <LinearGradient
//                 colors={[Colors.blue, Colors.skyblue]}
//                 style={styles.buttonGradient}
//                 start={{ x: 0, y: 0 }}
//                 end={{ x: 1, y: 0 }}
//               >
//                 <Text style={styles.signInButtonText}>Sign in with Google</Text>
//               </LinearGradient>
//             </TouchableOpacity>

//             {/* Sign In Button */}
//             <TouchableOpacity
//               style={[styles.signInButton, isLoading && styles.buttonDisabled]}
//               onPress={handleSignIn}
//               disabled={isLoading}
//             >
//               <LinearGradient
//                 colors={[Colors.blue, Colors.skyblue]}
//                 style={styles.buttonGradient}
//                 start={{ x: 0, y: 0 }}
//                 end={{ x: 1, y: 0 }}
//               >
//                 <Text style={styles.signInButtonText}>
//                   {isLoading ? t('auth.signingIn') : t('auth.signIn')}
//                 </Text>
//                 {!isLoading && <ArrowRight size={20} color={Colors.white} />}
//               </LinearGradient>
//             </TouchableOpacity>

//             {/* Sign Up Link */}
//             <View style={styles.signUpContainer}>
//               <Text style={styles.signUpText}>{t('auth.dontHaveAccount')} </Text>
//               <Link href="/(auth)/sign_up" asChild>
//                 <TouchableOpacity>
//                   <Text style={styles.signUpLink}>{t('auth.signUp')}</Text>
//                 </TouchableOpacity>
//               </Link>
//             </View>
//           </View>
//         </View>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Colors.background,
//   },
//   scrollContent: {
//     flexGrow: 1,
//   },
//   image: {
//     width: 150,
//     height: 100,
//     alignSelf: 'flex-start',
//     top: -30,
//     left: -10,
//   },
//   header: {
//     paddingTop: 80,
//     paddingBottom: 40,
//     paddingHorizontal: 24,
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 32,
//     fontWeight: 'bold',
//     color: Colors.white,
//     marginBottom: 8,
//     fontFamily: 'Inter-Bold',
//   },
//   headerSubtitle: {
//     fontSize: 16,
//     color: 'rgba(255, 255, 255, 0.9)',
//     textAlign: 'center',
//     fontFamily: 'Inter-Regular',
//   },
//   formContainer: {
//     flex: 1,
//     backgroundColor: Colors.white,
//     borderTopLeftRadius: 32,
//     borderTopRightRadius: 32,
//     marginTop: -20,
//     paddingTop: 32,
//     paddingHorizontal: 24,
//   },
//   form: {
//     flex: 1,
//   },
//   inputGroup: {
//     marginBottom: 24,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: Colors.darkGray,
//     marginBottom: 8,
//     fontFamily: 'Inter-SemiBold',
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: Colors.lightGray,
//     borderRadius: 16,
//     paddingHorizontal: 16,
//     paddingVertical: 4,
//     borderWidth: 2,
//     borderColor: 'transparent',
//   },
//   inputError: {
//     borderColor: Colors.error,
//   },
//   inputIcon: {
//     marginRight: 12,
//   },
//   input: {
//     flex: 1,
//     fontSize: 16,
//     color: Colors.darkGray,
//     paddingVertical: 16,
//     fontFamily: 'Inter-Regular',
//   },
//   eyeIcon: {
//     padding: 4,
//   },
//   errorText: {
//     fontSize: 14,
//     color: Colors.error,
//     marginTop: 4,
//     fontFamily: 'Inter-Regular',
//   },
//   forgotPassword: {
//     alignSelf: 'flex-end',
//     marginBottom: 32,
//   },
//   forgotPasswordText: {
//     fontSize: 14,
//     color: Colors.blue,
//     fontWeight: '600',
//     fontFamily: 'Inter-SemiBold',
//   },
//   signInButton: {
//     borderRadius: 16,
//     overflow: 'hidden',
//     marginBottom: 24,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.15,
//     shadowRadius: 12,
//     elevation: 8,
//   },
//   buttonDisabled: {
//     opacity: 0.7,
//   },
//   buttonGradient: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 18,
//     gap: 8,
//   },
//   signInButtonText: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: Colors.white,
//     fontFamily: 'Inter-Bold',
//   },
//   signUpContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: 'auto',
//     paddingBottom: 32,
//   },
//   signUpText: {
//     fontSize: 16,
//     color: Colors.gray,
//     fontFamily: 'Inter-Regular',
//   },
//   signUpLink: {
//     fontSize: 16,
//     color: Colors.blue,
//     fontWeight: '600',
//     fontFamily: 'Inter-SemiBold',
//   },
// });