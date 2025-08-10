import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FabricCheckmark } from "@/components/animations/FabricCheckmark";

const Index = () => {
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [remember, setRemember] = useState(true);
  const [role, setRole] = useState<"shop" | "wholesale" | "admin">("shop");
  const [showCheck, setShowCheck] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Login • Green Path Trade";
  }, []);

  const sendOtp = () => {
    if (!/^\+?[0-9]{8,15}$/.test(phone)) return toast.error("Enter a valid phone number");
    setOtpSent(true);
    toast.success("OTP sent");
  };

  const verifyOtp = () => {
    if (otp.length < 4) return toast.error("Invalid OTP");
    // Mock verify success
    setShowCheck(true);
    setTimeout(() => {
      localStorage.setItem("gpt_session", JSON.stringify({ phone, role, remember }));
      if (role === "shop") navigate("/shop/dashboard");
      if (role === "wholesale") navigate("/wholesale/orders");
      if (role === "admin") navigate("/admin/overview");
    }, 900);
  };

  return (
    <main className="min-h-screen grid place-items-center bg-background px-4">
      <Card className="w-full max-w-md animate-fade-in card-hover">
        <CardHeader>
          <CardTitle className="font-head text-2xl">Welcome to Green Path Trade</CardTitle>
          <p className="text-sm text-muted-foreground">B2B ordering for shopkeepers and wholesalers</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant={role === "shop" ? "default" : "outline"} onClick={() => setRole("shop")}>Shopkeeper</Button>
            <Button variant={role === "wholesale" ? "default" : "outline"} onClick={() => setRole("wholesale")}>Wholesaler</Button>
            <Button variant={role === "admin" ? "default" : "outline"} onClick={() => setRole("admin")}>Admin</Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input id="phone" placeholder="e.g. +11234567890" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-focus" />
          </div>

          {otpSent && (
            <div className="space-y-2 animate-fade-in">
              <Label htmlFor="otp">Enter OTP</Label>
              <Input id="otp" placeholder="••••" value={otp} onChange={(e) => setOtp(e.target.value)} className="tracking-widest text-center input-focus" />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch checked={remember} onCheckedChange={setRemember} id="remember" />
              <Label htmlFor="remember">Remember device</Label>
            </div>
            {!otpSent ? (
              <Button variant="cta" onClick={sendOtp} className="hover-scale">Get OTP</Button>
            ) : (
              <Button variant="cta" onClick={verifyOtp} className="hover-scale">Verify</Button>
            )}
          </div>

          {showCheck && (
            <div className="mt-2">
              <FabricCheckmark />
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

export default Index;
