import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/src/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStatus, setForgotStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [forgotError, setForgotError] = useState("");
  
  const { user, login, loginAsGuest } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate("/events");
    }
  }, [user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    const result = await login(data.email, data.password);
    if (result.success) {
      toast.success("Welcome back!", {
        description: "You have successfully logged in.",
      });
      navigate("/events");
    } else {
      toast.error("Login Failed", {
        description: result.error || "Invalid email or password.",
      });
    }
    setLoading(false);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotStatus("loading");
    setForgotError("");

    // Simulate API call
    setTimeout(() => {
      if (!forgotEmail.includes("@")) {
        setForgotStatus("error");
        setForgotError("Please enter a valid email address.");
      } else {
        setForgotStatus("success");
        toast.success("Reset link sent!", {
          description: "Please check your email for instructions.",
        });
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 pt-24 pb-12 relative overflow-hidden">
      {/* Lively Background Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-brand-green/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-red/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-brand-blue/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

      <Card className="w-full max-w-md rounded-[2.5rem] shadow-2xl border-none relative z-10 bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-6">
            <div className="flex items-baseline font-black text-4xl tracking-tighter">
              <span className="text-brand-green">C</span>
              <span className="text-brand-red">A</span>
              <span className="text-brand-dark-blue">B</span>
              <span className="text-brand-blue">arkada</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-slate-900">Welcome Back</CardTitle>
          <CardDescription className="text-lg">Login to your CABarkada account</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Mail size={16} className="text-brand-blue" /> Email Address
              </label>
              <Input 
                {...register("email")}
                type="email" 
                placeholder="name@example.com" 
                className={`h-14 rounded-2xl border-slate-200 focus:ring-brand-blue ${errors.email ? "border-brand-red" : ""}`}
              />
              {errors.email && (
                <p className="text-xs text-brand-red font-bold flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Lock size={16} className="text-brand-blue" /> Password
                </label>
                <button 
                  type="button"
                  onClick={() => {
                    setShowForgot(true);
                    setForgotStatus("idle");
                    setForgotError("");
                  }}
                  className="text-xs font-bold text-brand-blue hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <Input 
                {...register("password")}
                type="password" 
                placeholder="••••••••" 
                className={`h-14 rounded-2xl border-slate-200 focus:ring-brand-blue ${errors.password ? "border-brand-red" : ""}`}
              />
              {errors.password && (
                <p className="text-xs text-brand-red font-bold flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.password.message}
                </p>
              )}
            </div>
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 bg-brand-blue hover:bg-brand-dark-blue rounded-2xl text-xl font-bold shadow-lg shadow-brand-blue/20 transition-all hover:scale-[1.02]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Logging in...
                </>
              ) : "Login"}
            </Button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm uppercase">
                <span className="bg-white px-4 text-slate-500 font-black tracking-widest">Or</span>
              </div>
            </div>

            <Button 
              type="button" 
              variant="outline"
              onClick={() => {
                loginAsGuest();
                toast.info("Logged in as Guest", {
                  description: "You can browse events but some features may be limited.",
                });
                navigate("/events");
              }}
              className="w-full border-2 border-brand-blue text-brand-blue hover:bg-brand-blue/5 h-14 rounded-2xl text-lg font-black transition-all hover:scale-[1.02]"
            >
              CONTINUE AS GUEST
            </Button>
          </form>
          <div className="mt-8 text-center text-sm text-slate-600">
            Don't have an account?{" "}
            <Link to="/register" className="text-brand-blue font-black hover:underline">
              Create Account here
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Forgot Password Modal */}
      <Dialog open={showForgot} onOpenChange={setShowForgot}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] p-8 border-none shadow-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900">Reset Password</DialogTitle>
            <DialogDescription className="text-slate-600">
              Enter your email address and we'll send you instructions to reset your password.
            </DialogDescription>
          </DialogHeader>

          {forgotStatus === "success" ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <div className="space-y-2">
                <p className="font-bold text-slate-900">Check your inbox!</p>
                <p className="text-sm text-slate-500">We've sent a password reset link to <span className="font-bold">{forgotEmail}</span>.</p>
              </div>
              <Button 
                onClick={() => setShowForgot(false)}
                className="w-full h-12 bg-brand-blue rounded-xl font-bold"
              >
                Back to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Email Address</label>
                <Input 
                  type="email" 
                  placeholder="name@example.com" 
                  required 
                  className={`h-12 rounded-xl border-slate-200 ${forgotStatus === "error" ? "border-brand-red ring-brand-red" : ""}`}
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
                {forgotStatus === "error" && (
                  <p className="text-xs text-brand-red flex items-center gap-1 font-bold">
                    <AlertCircle size={12} /> {forgotError}
                  </p>
                )}
              </div>
              <DialogFooter className="pt-4">
                <Button 
                  type="submit" 
                  disabled={forgotStatus === "loading"}
                  className="w-full h-12 bg-brand-blue hover:bg-brand-dark-blue rounded-xl font-bold shadow-lg shadow-brand-blue/20"
                >
                  {forgotStatus === "loading" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : "Send Reset Link"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
