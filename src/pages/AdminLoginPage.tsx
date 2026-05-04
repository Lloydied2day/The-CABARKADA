import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/src/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, ShieldAlert, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

const adminLoginSchema = z.object({
  email: z.string().email("Please enter a valid admin email address"),
  password: z.string().min(6, "Access key must be at least 6 characters"),
});

type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

export default function AdminLoginPage() {
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
  });

  const onSubmit = async (data: AdminLoginFormValues) => {
    setLoading(true);
    const result = await loginAdmin(data.email, data.password);
    if (result.success) {
      toast.success("Identity Verified", {
        description: "Welcome to the Administrative Portal.",
      });
      navigate("/admin");
    } else {
      toast.error("Access Denied", {
        description: result.error || "Invalid administrative credentials.",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 relative overflow-hidden">
      {/* Dark, serious background */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(30,58,138,0.2)_0%,transparent_70%)]" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="rounded-[2rem] border-slate-800 bg-slate-950/50 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 border border-red-500/20">
                <ShieldAlert size={32} />
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-white uppercase tracking-widest">Admin Portal</CardTitle>
            <CardDescription className="text-slate-400">
              Restricted access. Authorized personnel only.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Admin Email</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                  <Input 
                    {...register("email")}
                    type="email" 
                    placeholder="admin@cabarkada.gov.ph" 
                    className={`h-14 bg-slate-900/50 border-slate-800 text-white pl-12 rounded-xl focus:ring-red-500 focus:border-red-500 ${errors.email ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 font-bold flex items-center gap-1 ml-1">
                    <AlertCircle size={12} /> {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Access Key</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                  <Input 
                    {...register("password")}
                    type="password" 
                    placeholder="Enter admin password" 
                    className={`h-14 bg-slate-900/50 border-slate-800 text-white pl-12 rounded-xl focus:ring-red-500 focus:border-red-500 ${errors.password ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 font-bold flex items-center gap-1 ml-1">
                    <AlertCircle size={12} /> {errors.password.message}
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-red-600/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : "Verify Identity"}
              </Button>

              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => navigate("/")}
                className="w-full text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 gap-2"
              >
                <ArrowLeft size={16} /> Return to Public Site
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
