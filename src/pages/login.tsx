"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { User, Lock, Leaf, Users, Mail } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { getDashboardPath, isPathAllowedForRole, UserRole } from "@/utils/routes"

const Login = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [joinAs, setJoinAs] = useState<"distributor" | "shopkeeper" | "salesperson" | "">("")
  const [rememberMe, setRememberMe] = useState(false)
  // Forgot password state
  const [forgotOpen, setForgotOpen] = useState(false)
  const [fpEmail, setFpEmail] = useState("")
  const [fpOtp, setFpOtp] = useState("")
  const [fpNewPass, setFpNewPass] = useState("")
  const [fpStep, setFpStep] = useState<1 | 2>(1)
  const [fpLoading, setFpLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, setUser } = useAuth()

  useEffect(() => {
    document.title = "Login • Oderly"
  }, [])

  // If already logged in, redirect to role-specific dashboard
  useEffect(() => {
    if (!user) return
    const role = (user.role || "") as UserRole
    navigate(getDashboardPath(role), { replace: true })
  }, [user, navigate])

  const handleLogin = async () => {
    if (!username || !password || !joinAs) {
      return toast.error("Please fill in all fields")
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(username)) {
      return toast.error("Please enter a valid email address")
    }

    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters")
    }

    setIsLoading(true)
    try {
      const res = await api.login({ email: username.trim().toLowerCase(), password, role: joinAs as 'distributor' | 'shopkeeper' | 'salesperson' })

      // Set auth context
      setUser(res.user)

      toast.success("Login successful!")
      // Optional: persist UI selection
      localStorage.setItem("joinAs", joinAs)

      // Determine role and target
      const role = ((res.user?.role as string) || joinAs) as UserRole
      const from = (location.state as any)?.from?.pathname as string | undefined
      const fallback = getDashboardPath(role)
      const target = from && isPathAllowedForRole(from, role) ? from : fallback
      navigate(target, { replace: true })
    } catch (e: any) {
      const msg = String(e?.message || '').toLowerCase()
      if (msg.includes('user_not_found')) return toast.error('No account found with this email')
      if (msg.includes('invalid_credentials')) return toast.error('Invalid email, password, or role')
      if (msg.includes('wrong_password')) return toast.error('Incorrect password')
      if (msg.includes('valid role is required')) return toast.error('Please select a valid role')
      if (msg.includes('email and password are required')) return toast.error('Email and password are required')
      toast.error(e?.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = () => {
    setForgotOpen(true)
    setFpEmail("")
    setFpOtp("")
    setFpNewPass("")
    setFpStep(1)
  }

  const sendResetOtp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(fpEmail)) return toast.error("Enter a valid email")
    setFpLoading(true)
    try {
      await api.forgotPasswordSendOtp(fpEmail.trim().toLowerCase())
      toast.success("Verification code sent")
      setFpStep(2)
    } catch (e: any) {
      toast.error(e?.message || "Failed to send code")
    } finally {
      setFpLoading(false)
    }
  }

  const resetPassword = async () => {
    if (!fpOtp || fpOtp.length < 4) return toast.error("Enter the code sent to your email")
    if (fpNewPass.length < 6) return toast.error("Password must be at least 6 characters")
    setFpLoading(true)
    try {
      const res = await api.resetPassword({
        email: fpEmail.trim().toLowerCase(),
        otp: fpOtp,
        newPassword: fpNewPass,
      })
      // Set auth context
      setUser(res.user)
      toast.success("Password updated. Signed in!")
      const role = ((res.user?.role as string) || joinAs) as UserRole
      const from = (location.state as any)?.from?.pathname as string | undefined
      const fallback = getDashboardPath(role)
      const target = from && isPathAllowedForRole(from, role) ? from : fallback
      navigate(target, { replace: true })
    } catch (e: any) {
      toast.error(e?.message || "Reset failed")
    } finally {
      setFpLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex flex-col items-center justify-center p-6">
      {/* Logo Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4">
          <Leaf className="w-10 h-10 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Oderly</h1>
        <p className="text-slate-600">B2B Trading Platform</p>
      </div>

      {/* Login Form */}
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-slate-800">Sign in to your account</h2>
        </div>

        <div className="space-y-4">
          {/* Username Input */}
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-600 w-5 h-5" />
              <Input
                id="username"
                type="text"
                placeholder="E-mail or Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-12 h-12 bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-600 w-5 h-5" />
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 h-12 bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
              />
            </div>

          </div>

          {/* Join As Select */}
          <div className="space-y-2">
            <div className="relative">
              <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-600 w-5 h-5 z-10" />
              <Select
                value={joinAs}
                onValueChange={(value: "distributor" | "shopkeeper" | "salesperson") => setJoinAs(value)}
              >
                <SelectTrigger className="pl-12 h-12 bg-white border border-slate-200 text-slate-800 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200">
                  <SelectValue placeholder="Join as" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distributor">Distributor</SelectItem>
                  <SelectItem value="shopkeeper">Shopkeeper</SelectItem>
                  <SelectItem value="salesperson">Salesperson</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Remember Me and Forgot Password Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                className="border-slate-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
              />
              <label
                htmlFor="remember"
                className="text-sm font-medium text-slate-700 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Remember me
              </label>
            </div>
            <button
              onClick={handleForgotPassword}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline transition-colors duration-200"
            >
              Forgot password?
            </button>
          </div>

          {/* Login Button */}
          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 h-12 rounded-lg transition-all duration-200 hover:shadow-md hover:shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </div>
            ) : (
              "Sign In"
            )}
          </Button>

          {/* Forgot Password Panel */}
          {forgotOpen && (
            <div className="mt-4 p-4 rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-800">Reset password</h3>
                <button onClick={() => setForgotOpen(false)} className="text-slate-500 hover:text-slate-700 text-sm">Close</button>
              </div>
              {fpStep === 1 ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 w-4 h-4" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={fpEmail}
                      onChange={(e) => setFpEmail(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button onClick={sendResetOtp} disabled={fpLoading} className="w-full">
                    {fpLoading ? "Sending..." : "Send code"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={fpOtp}
                      onChange={(e) => setFpOtp(e.target.value)}
                      className="pl-9"
                      maxLength={6}
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 w-4 h-4" />
                    <Input
                      type="password"
                      placeholder="New password"
                      value={fpNewPass}
                      onChange={(e) => setFpNewPass(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button onClick={resetPassword} disabled={fpLoading} className="w-full">
                    {fpLoading ? "Updating..." : "Update password"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Sign Up Link */}
          <div className="text-center pt-4 border-t border-slate-200">
            <p className="text-slate-600 text-sm">
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/register")}
                className="text-emerald-600 font-semibold hover:text-emerald-700 hover:underline transition-all duration-200"
              >
                Create account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
