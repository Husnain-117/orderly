"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Mail, Building2, Shield, Leaf, Users, Lock } from "lucide-react"
import { api } from "@/lib/api"

const Register = () => {
  const [email, setEmail] = useState("")
  const [organizationName, setOrganizationName] = useState("")
  const [joinAs, setJoinAs] = useState<"distributor" | "shopkeeper" | "salesperson" | "">("")
  const [password, setPassword] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [resendIn, setResendIn] = useState<number>(0)
  const navigate = useNavigate()

  useEffect(() => {
    document.title = "Register • Oderly"
  }, [])

  // Countdown for resend
  useEffect(() => {
    if (!otpSent || resendIn <= 0) return
    const id = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [otpSent, resendIn])

  const sendOtp = async () => {
    if (!email || !joinAs || !password) {
      return toast.error("Please fill in all fields")
    }
    if (joinAs === 'distributor' && !organizationName) {
      return toast.error("Organization name is required for distributors")
    }

    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters")
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return toast.error("Please enter a valid email address")
    }

    setIsLoading(true)
    try {
      await api.sendOtp(email)
      setOtpSent(true)
      setResendIn(60)
      toast.success("Verification code sent to your email.")
    } catch (e: any) {
      const msg = (e?.message || "").toLowerCase()
      if (msg.includes("rate limit")) toast.error("Please wait before requesting another code.")
      else toast.error(e?.message || "Could not send code")
    } finally {
      setIsLoading(false)
    }
  }

  const resendEmail = async () => {
    if (!email) return
    if (resendIn > 0) return
    setIsLoading(true)
    try {
      await api.sendOtp(email)
      toast.success("Code resent.")
      setResendIn(60)
    } catch (e: any) {
      toast.error(e?.message || "Could not resend email")
    } finally {
      setIsLoading(false)
    }
  }

  const verifyAndRegister = async () => {
    if (!email || !organizationName || !joinAs || !password) {
      return toast.error("Please fill in all fields")
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return toast.error("Please enter a valid email address")
    }
    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters")
    }
    if (!otp || otp.length < 4) {
      return toast.error("Enter the code sent to your email")
    }
    setIsLoading(true)
    try {
      // 1) Verify the OTP
      await api.verifyOtp({ email, otp })
      // 2) Register the account on backend (persists to DB and sets session cookie)
      const reg = await api.register({ email, password, role: joinAs, organizationName })
      toast.success("Account created!")
      const role = reg.user?.role || joinAs
      if (role === "distributor") navigate("/wholesale/dashboard")
      else if (role === "shopkeeper") navigate("/shop/dashboard")
      else navigate("/sales/link-distributor")
    } catch (e: any) {
      const msg = String(e?.message || "")
      if (msg.toLowerCase().includes("already exists")) {
        toast.error("Account already exists. Please log in.")
        return navigate("/login")
      }
      toast.error(e?.message || "Verification failed")
    } finally {
      setIsLoading(false)
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

      {/* Registration Form */}
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-slate-800">Create your account</h2>
        </div>

          <div className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-600 w-5 h-5" />
                <Input
                  id="email"
                  type="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-12 bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                  disabled={otpSent}
                />
              </div>
            </div>

            {/* Organization Name Input */}
            <div className="space-y-2">
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-600 w-5 h-5" />
                <Input
                  id="organization"
                  type="text"
                  placeholder="Organization Name"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="pl-12 h-12 bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                  disabled={otpSent}
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
                  disabled={otpSent}
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
                  disabled={otpSent}
                >
                  <SelectTrigger
                    className="pl-12 h-12 bg-white border border-slate-200 text-slate-800 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                  >
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

            {/* OTP Input - Shows after code is sent */}
            {otpSent && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-600 w-5 h-5" />
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="pl-12 h-12 bg-white border-slate-200 text-slate-800 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 text-center tracking-widest"
                    maxLength={6}
                  />
                </div>
                <p className="text-slate-700 text-sm text-center">
                  We sent a verification code to <span className="font-medium">{email}</span>.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={resendIn > 0 || isLoading}
                    onClick={resendEmail}
                  >
                    {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
                  </Button>
                </div>
              </div>
            )}

            {/* Action Button */}
            <Button
              onClick={otpSent ? verifyAndRegister : sendOtp}
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 h-12 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-emerald-500/20"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {otpSent ? "Verifying..." : "Sending Code..."}
                </div>
              ) : otpSent ? "VERIFY & CREATE ACCOUNT" : "SEND VERIFICATION CODE"}
            </Button>

            {/* Login Link */}
            <div className="text-center pt-4">
              <p className="text-slate-600 text-sm">
                Already have an account?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-emerald-600 font-semibold hover:text-emerald-700 hover:underline transition-all duration-200"
                >
                  Login here
                </button>
              </p>
            </div>
          </div>
      </div>
    </div>
  )
}

export default Register
