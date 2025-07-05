"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Brain,
  Sparkles,
  Heart,
  Shield,
  Calendar,
  Users,
  MessageCircle,
  Mic,
  Download,
  Cloud,
  Star,
  Check,
  ArrowRight,
  Mail,
  Lock,
  User,
  Loader2,
  Eye,
  EyeOff,
  Phone,
  RefreshCw,
  Copy,
  CheckCircle,
  Smartphone,
  Apple,
  Globe
} from "lucide-react";
import Link from "next/link";
import { useLocalUser } from "@/hooks/useLocalUser";
import { useRouter } from "next/navigation";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  rememberDevice: boolean;
  verificationMethod: "email" | "sms";
}

export default function HomePage() {
  const [authMode, setAuthMode] = useState<"signin" | "signup" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isGeneratingPassword, setIsGeneratingPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");
  const router = useRouter();
  const { signIn, signUp, isAuthenticated, isLoading } = useLocalUser();

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    rememberDevice: false,
    verificationMethod: "email"
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/activity");
    }
  }, [isAuthenticated, router]);

  const features = [
    {
      icon: Brain,
      title: "Smart Memory",
      description: "AI remembers your conversations and important details",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: MessageCircle,
      title: "Intelligent Chat",
      description: "Natural conversations with context awareness",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Mic,
      title: "Voice Input",
      description: "Hands-free interaction with speech recognition",
      color: "from-green-500 to-green-600"
    },
    {
      icon: Heart,
      title: "Daily Check-ins",
      description: "Track your mood and emotional well-being",
      color: "from-pink-500 to-pink-600"
    },
    {
      icon: Calendar,
      title: "Smart Reminders",
      description: "Never forget important dates and tasks",
      color: "from-orange-500 to-orange-600"
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "Your data stays private and secure",
      color: "from-indigo-500 to-indigo-600"
    },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Product Manager",
      content: "MyAi has transformed how I reflect on my daily experiences. It's like having a thoughtful friend who never forgets.",
      rating: 5
    },
    {
      name: "David Rodriguez",
      role: "Writer",
      content: "The voice input feature is incredible. I can capture thoughts while walking, and MyAi remembers everything perfectly.",
      rating: 5
    },
    {
      name: "Emily Johnson",
      role: "Student",
      content: "Perfect for tracking my personal growth. The daily check-ins help me understand my emotional patterns.",
      rating: 5
    }
  ];

  const generateStrongPassword = () => {
    setIsGeneratingPassword(true);

    setTimeout(() => {
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const allChars = lowercase + uppercase + numbers + symbols;

      let password = '';
      // Ensure at least one character from each category
      password += lowercase[Math.floor(Math.random() * lowercase.length)];
      password += uppercase[Math.floor(Math.random() * uppercase.length)];
      password += numbers[Math.floor(Math.random() * numbers.length)];
      password += symbols[Math.floor(Math.random() * symbols.length)];

      // Fill the rest randomly
      for (let i = 4; i < 16; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
      }

      // Shuffle the password
      password = password.split('').sort(() => Math.random() - 0.5).join('');

      setGeneratedPassword(password);
      setFormData(prev => ({ ...prev, password, confirmPassword: password }));
      setIsGeneratingPassword(false);
    }, 1000);
  };

  const copyPasswordToClipboard = () => {
    navigator.clipboard.writeText(generatedPassword);
  };

  const handleSocialAuth = (provider: "google" | "apple") => {
    console.log(`Authenticating with ${provider}`);
    // TODO: Implement social auth with Convex Auth
    setAuthError("Social authentication will be implemented in a future update.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsSubmitting(true);

    try {
      // Validation
      if (authMode === "signup") {
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
          setAuthError("Please enter your first and last name");
          return;
        }
        if (!formData.phone.trim()) {
          setAuthError("Please enter your phone number");
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setAuthError("Passwords do not match");
          return;
        }
        if (formData.password.length < 8) {
          setAuthError("Password must be at least 8 characters long");
          return;
        }
      }

      if (!formData.email.trim()) {
        setAuthError("Please enter your email address");
        return;
      }

      if (!formData.password.trim()) {
        setAuthError("Please enter your password");
        return;
      }

      // Attempt authentication
      let result;
      if (authMode === "signup") {
        const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
        result = await signUp(formData.email.trim(), formData.password, fullName);
      } else {
        result = await signIn(formData.email.trim(), formData.password);
      }

      if (result.success) {
        // Redirect to activity page
        router.push("/activity");
      } else {
        setAuthError(result.error || "Authentication failed");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setAuthError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerification = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);

    // Simulate verification process
    setTimeout(() => {
      setIsVerifying(false);
      setShowVerificationDialog(false);
      window.location.href = "/activity";
    }, 2000);
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/\D/g, '');
    const match = phoneNumber.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      return !match[2] ? match[1] : `(${match[1]}) ${match[2]}${match[3] ? `-${match[3]}` : ''}`;
    }
    return phoneNumber;
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*()_+\-=\[\]{}|;':\",./<>?]/.test(password)) strength++;

    if (strength <= 2) return { level: "weak", color: "text-red-600", bg: "bg-red-100" };
    if (strength <= 3) return { level: "medium", color: "text-yellow-600", bg: "bg-yellow-100" };
    return { level: "strong", color: "text-green-600", bg: "bg-green-100" };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  // Verification Dialog
  if (showVerificationDialog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {formData.verificationMethod === "email" ? (
                <Mail className="w-8 h-8 text-white" />
              ) : (
                <Smartphone className="w-8 h-8 text-white" />
              )}
            </div>
            <CardTitle>Verify Your Account</CardTitle>
            <p className="text-slate-600 mt-2">
              We've sent a verification code to your {formData.verificationMethod === "email" ? "email" : "phone"}
            </p>
            <p className="text-sm font-medium text-slate-700">
              {formData.verificationMethod === "email" ? formData.email : formData.phone}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerification} className="space-y-4">
              <div>
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="text-center text-lg font-mono tracking-widest"
                  maxLength={6}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                disabled={isVerifying || verificationCode.length !== 6}
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verify Account
                  </>
                )}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-slate-600">Didn't receive the code?</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      verificationMethod: prev.verificationMethod === "email" ? "sms" : "email"
                    }))}
                  >
                    Send via {formData.verificationMethod === "email" ? "SMS" : "Email"}
                  </Button>
                  <Button type="button" variant="outline" size="sm">
                    Resend Code
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  MyAi
                </h1>
              </div>
              <h2 className="text-2xl font-semibold text-slate-800 mb-2">
                {authMode === "signin" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-slate-600">
                {authMode === "signin"
                  ? "Sign in to continue your journey"
                  : "Join thousands growing with MyAi"
                }
              </p>
            </div>

            {/* Social Auth Buttons */}
            <div className="space-y-3 mb-6">
              <Button
                onClick={() => handleSocialAuth("google")}
                variant="outline"
                className="w-full gap-3 h-12 border-2"
              >
                <Globe className="w-5 h-5 text-red-500" />
                {authMode === "signin" ? "Sign in" : "Sign up"} with Google
              </Button>
              <Button
                onClick={() => handleSocialAuth("apple")}
                variant="outline"
                className="w-full gap-3 h-12 border-2"
              >
                <Apple className="w-5 h-5" />
                {authMode === "signin" ? "Sign in" : "Sign up"} with Apple
              </Button>
            </div>

            <div className="relative mb-6">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white px-4 text-sm text-slate-500">or</span>
              </div>
            </div>

            {/* Auth Form */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-center">
                  {authMode === "signin" ? "Sign In" : "Create Account"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {authError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="text-red-800 text-sm">{authError}</div>
                    </div>
                  )}

                  {authMode === "signup" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <div className="relative mt-1">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            id="firstName"
                            type="text"
                            placeholder="First name"
                            value={formData.firstName}
                            onChange={(e) => handleInputChange("firstName", e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <div className="relative mt-1">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            id="lastName"
                            type="text"
                            placeholder="Last name"
                            value={formData.lastName}
                            onChange={(e) => handleInputChange("lastName", e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {authMode === "signup" && (
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative mt-1">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="(555) 123-4567"
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", formatPhoneNumber(e.target.value))}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        className="pl-10 pr-20"
                        required
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-1">
                        {authMode === "signup" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={generateStrongPassword}
                            disabled={isGeneratingPassword}
                            title="Generate strong password"
                          >
                            {isGeneratingPassword ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3 h-3" />
                            )}
                          </Button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    {authMode === "signup" && formData.password && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <div className={`text-xs px-2 py-1 rounded ${passwordStrength.bg} ${passwordStrength.color}`}>
                            {passwordStrength.level} password
                          </div>
                          {generatedPassword && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={copyPasswordToClipboard}
                              className="h-6 gap-1 text-xs"
                            >
                              <Copy className="w-3 h-3" />
                              Copy
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {authMode === "signup" && (
                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative mt-1">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                          className="pl-10 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <p className="text-red-600 text-xs mt-1">Passwords do not match</p>
                      )}
                    </div>
                  )}

                  {authMode === "signup" && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Verification Method</Label>
                        <div className="flex gap-3 mt-2">
                          <Button
                            type="button"
                            variant={formData.verificationMethod === "email" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleInputChange("verificationMethod", "email")}
                            className="gap-2"
                          >
                            <Mail className="w-4 h-4" />
                            Email
                          </Button>
                          <Button
                            type="button"
                            variant={formData.verificationMethod === "sms" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleInputChange("verificationMethod", "sms")}
                            className="gap-2"
                          >
                            <Smartphone className="w-4 h-4" />
                            SMS
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="rememberDevice"
                      checked={formData.rememberDevice}
                      onChange={(e) => handleInputChange("rememberDevice", e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="rememberDevice" className="text-sm">
                      Remember this device for 30 days
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {authMode === "signin" ? "Signing In..." : "Creating Account..."}
                      </>
                    ) : (
                      <>
                        {authMode === "signin" ? "Sign In" : "Create Account"}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-slate-600">
                    {authMode === "signin" ? "Don't have an account?" : "Already have an account?"}
                    <button
                      onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}
                      className="ml-2 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {authMode === "signin" ? "Sign up" : "Sign in"}
                    </button>
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <button
                    onClick={() => setAuthMode(null)}
                    className="w-full text-slate-600 hover:text-slate-800 text-sm"
                  >
                    ← Back to home
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              MyAi
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setAuthMode("signin")}>
              Sign In
            </Button>
            <Button onClick={() => setAuthMode("signup")} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6 bg-blue-100 text-blue-800">
            ✨ Your Personal Memory Companion
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6 leading-tight">
            AI that <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">remembers</span> what matters to you
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            MyAi is your thoughtful companion that helps you remember, reflect, and grow.
            Have meaningful conversations while building a personal memory bank of your experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => setAuthMode("signup")}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg px-8 py-6"
            >
              Start Your Journey
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setAuthMode("signin")}
              className="text-lg px-8 py-6 border-2"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-800 mb-4">Everything you need for personal growth</h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Powerful features designed to help you understand yourself better and maintain meaningful connections.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">{feature.title}</h3>
                  <p className="text-slate-600">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-800 mb-4">Loved by thoughtful people</h2>
          <p className="text-xl text-slate-600">See how MyAi is helping people grow and reflect</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-4 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-slate-800">{testimonial.name}</div>
                  <div className="text-slate-600 text-sm">{testimonial.role}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-4xl mx-auto border-0 shadow-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to start your journey?</h2>
            <p className="text-xl mb-8 text-blue-100">
              Join thousands of people using MyAi to better understand themselves and grow.
            </p>
            <Button
              size="lg"
              onClick={() => setAuthMode("signup")}
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-blue-200 text-sm mt-4">No credit card required • Start in 30 seconds</p>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-slate-800 font-semibold">MyAi</span>
          </div>
          <p className="text-slate-600">© 2025 MyAi. Built with ❤️ for personal growth.</p>
        </div>
      </footer>
    </div>
  );
}
