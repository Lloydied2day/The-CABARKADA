import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/src/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, ChevronLeft, User, MapPin, Phone, Mail, Lock, Calendar, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { CATEGORIES } from "@/src/constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as UICalendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const registerSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  birthday: z.string().min(1, "Birthday is required"),
  age: z.string().min(1, "Age is required").refine((val) => !isNaN(Number(val)), "Age must be a number"),
  gender: z.string().min(1, "Gender is required"),
  email: z.string().email("Please enter a valid email address"),
  mobileNumber: z.string().min(11, "Mobile number must be at least 11 digits"),
  purok: z.string().min(1, "Purok is required"),
  street: z.string().min(1, "Street address is required"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  parentName: z.string().optional(),
  parentContact: z.string().optional(),
}).refine((data) => {
  const ageNum = parseInt(data.age);
  if (ageNum < 18) {
    return !!data.parentName && !!data.parentContact && data.parentName.length > 0 && data.parentContact.length > 0;
  }
  return true;
}, {
  message: "Parent/Guardian info is required for minors",
  path: ["parentName"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, register: registerUser, updateInterests } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user && user.hasSelectedInterests) {
      navigate("/events");
    }
  }, [user, navigate]);

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    setValue,
    control,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      gender: "",
      purok: "",
    }
  });

  const password = watch("password", "");
  const age = watch("age", "");
  const birthday = watch("birthday", "");

  // Auto-calculate age if birthday changes
  React.useEffect(() => {
    if (birthday) {
      const birthDate = new Date(birthday);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      if (calculatedAge >= 0) {
        setValue("age", String(calculatedAge));
      }
    }
  }, [birthday, setValue]);

  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getPasswordStrength(password);

  const nextStep = async () => {
    let fieldsToValidate: (keyof RegisterFormValues)[] = [];
    if (step === 1) fieldsToValidate = ["firstName", "lastName", "birthday", "age", "gender"];
    if (step === 2) fieldsToValidate = ["email", "mobileNumber", "purok", "street", "password"];
    
    // Step 3 validation is part of form submission or manual trigger
    if (step === 3 && parseInt(age) < 18) {
      fieldsToValidate = ["parentName", "parentContact"];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      if (step === 2 && parseInt(age) < 18) {
        setStep(prev => prev + 1);
      } else if (step === 2) {
        // Skip step 3 if not a minor
        handleSubmit(onSubmit)();
      } else if (step === 1) {
        setStep(prev => prev + 1);
      } else {
        handleSubmit(onSubmit)();
      }
    } else {
      toast.error("Validation Error", {
        description: "Please fill in all required fields correctly.",
      });
    }
  };

  const prevStep = () => setStep(prev => prev - 1);

  const onSubmit = async (data: RegisterFormValues) => {
    if (!agreedToTerms) {
      toast.error("Terms & Conditions", {
        description: "You must agree to the terms to complete registration.",
      });
      return;
    }
    
    setLoading(true);
    const result = await registerUser({
      ...data,
      age: parseInt(data.age),
      barangay: "New Cabalan" // Project context
    });

    if (result.success) {
      setShowSuccess(true);
      toast.success("Account Created!", {
        description: "Welcome to the Barkada!",
      });
    } else {
      toast.error("Registration Failed", {
        description: result.error || "Something went wrong. Please try again.",
      });
    }
    setLoading(false);
  };

  const handleSuccessNext = () => {
    setShowSuccess(false);
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = async () => {
    setLoading(true);
    await updateInterests(selectedInterests);
    setLoading(false);
    setShowOnboarding(false);
    navigate("/events");
  };

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 pt-24 pb-12 relative overflow-hidden">
      {/* Lively Background Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-brand-green/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-red/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-brand-blue/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

      <Card className="w-full max-w-2xl rounded-[2.5rem] shadow-2xl border-none relative z-10 bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-6">
            <div className="flex items-baseline font-black text-4xl tracking-tighter">
              <span className="text-brand-green">C</span>
              <span className="text-brand-red">A</span>
              <span className="text-brand-dark-blue">B</span>
              <span className="text-brand-blue">arkada</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-slate-900">Join the Barkada</CardTitle>
          <CardDescription className="text-lg">Step {step} of {parseInt(age) < 18 ? 3 : 2}: {step === 1 ? "Personal Info" : step === 2 ? "Contact & Address" : "Parent/Guardian Info"}</CardDescription>
          
          {/* Progress Bar */}
          <div className="flex gap-2 justify-center mt-4">
            {[1, 2, 3].map((i) => {
              if (i === 3 && parseInt(age) >= 18) return null;
              return (
                <div 
                  key={i} 
                  className={`h-2 w-12 rounded-full transition-all duration-300 ${
                    step >= i ? "bg-brand-blue" : "bg-slate-200"
                  }`} 
                />
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <User size={16} className="text-brand-blue" /> First Name
                      </label>
                      <Input 
                        {...register("firstName")}
                        placeholder="Juan" 
                        className={`h-12 rounded-xl border-slate-200 focus:ring-brand-blue ${errors.firstName ? "border-brand-red" : ""}`} 
                      />
                      {errors.firstName && <p className="text-xs text-brand-red font-bold">{errors.firstName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Last Name</label>
                      <Input 
                        {...register("lastName")}
                        placeholder="Dela Cruz" 
                        className={`h-12 rounded-xl border-slate-200 ${errors.lastName ? "border-brand-red" : ""}`} 
                      />
                      {errors.lastName && <p className="text-xs text-brand-red font-bold">{errors.lastName.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Calendar size={16} className="text-brand-blue" /> Birthday
                      </label>
                      <Controller
                        control={control}
                        name="birthday"
                        render={({ field }) => (
                          <Popover>
                            <PopoverTrigger
                              render={
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full h-12 rounded-xl border-slate-200 justify-start text-left font-normal bg-white",
                                    !field.value && "text-slate-500",
                                    errors.birthday && "border-brand-red"
                                  )}
                                >
                                  <Calendar size={16} className="mr-2 text-brand-blue" />
                                  {field.value ? (
                                    (() => {
                                      try {
                                        return format(parseISO(field.value), "PPP");
                                      } catch (e) {
                                        return <span>Pick a date</span>;
                                      }
                                    })()
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              }
                            />
                            <PopoverContent className="w-auto p-0 border-slate-200 bg-white" align="start">
                              <UICalendar
                                mode="single"
                                selected={field.value ? parseISO(field.value) : undefined}
                                onSelect={(date) => {
                                  if (date) {
                                    field.onChange(format(date, "yyyy-MM-dd"));
                                  }
                                }}
                                initialFocus
                                className="bg-white"
                                captionLayout="dropdown"
                                startMonth={new Date(1900, 0)}
                                endMonth={new Date()}
                              />
                            </PopoverContent>
                          </Popover>
                        )}
                      />
                      {errors.birthday && <p className="text-xs text-brand-red font-bold">{errors.birthday.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Age</label>
                      <Input 
                        {...register("age")}
                        placeholder="Age" 
                        readOnly
                        className="h-12 rounded-xl border-slate-200 bg-slate-50 cursor-not-allowed" 
                      />
                      {errors.age && <p className="text-xs text-brand-red font-bold">{errors.age.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Gender</label>
                    <Select onValueChange={(v) => setValue("gender", v)} value={watch("gender") || ""}>
                      <SelectTrigger className={`h-12 rounded-xl border-slate-200 ${errors.gender ? "border-brand-red" : ""}`}>
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                        <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && <p className="text-xs text-brand-red font-bold">{errors.gender.message}</p>}
                  </div>
                  <Button type="button" onClick={nextStep} className="w-full h-14 bg-brand-blue hover:bg-brand-dark-blue rounded-2xl text-lg gap-2 shadow-lg shadow-brand-blue/20">
                    Next Step <ChevronRight size={20} />
                  </Button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Mail size={16} className="text-brand-blue" /> Email
                      </label>
                      <Input 
                        {...register("email")}
                        type="email"
                        placeholder="name@example.com" 
                        className={`h-12 rounded-xl border-slate-200 ${errors.email ? "border-brand-red" : ""}`} 
                      />
                      {errors.email && <p className="text-xs text-brand-red font-bold">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Phone size={16} className="text-brand-blue" /> Mobile
                      </label>
                      <Input 
                        {...register("mobileNumber")}
                        placeholder="0912 345 6789" 
                        className={`h-12 rounded-xl border-slate-200 ${errors.mobileNumber ? "border-brand-red" : ""}`} 
                      />
                      {errors.mobileNumber && <p className="text-xs text-brand-red font-bold">{errors.mobileNumber.message}</p>}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <MapPin size={16} className="text-brand-blue" /> Address Details
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Select onValueChange={(v) => setValue("purok", v)} value={watch("purok") || ""}>
                          <SelectTrigger className={`h-12 rounded-xl border-slate-200 ${errors.purok ? "border-brand-red" : ""}`}>
                            <SelectValue placeholder="Select Purok" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Purok 1">Purok 1</SelectItem>
                            <SelectItem value="Purok 2">Purok 2</SelectItem>
                            <SelectItem value="Purok 3">Purok 3</SelectItem>
                            <SelectItem value="Purok 4">Purok 4</SelectItem>
                            <SelectItem value="Purok 5">Purok 5</SelectItem>
                            <SelectItem value="Purok 6">Purok 6</SelectItem>
                            <SelectItem value="Purok 7">Purok 7</SelectItem>
                            <SelectItem value="Iram">Iram</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.purok && <p className="text-xs text-brand-red font-bold">{errors.purok.message}</p>}
                      </div>
                      <div className="space-y-1">
                        <Input 
                          {...register("street")}
                          placeholder="Street Address" 
                          className={`h-12 rounded-xl border-slate-200 ${errors.street ? "border-brand-red" : ""}`} 
                        />
                        {errors.street && <p className="text-xs text-brand-red font-bold">{errors.street.message}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Lock size={16} className="text-brand-blue" /> Account Password
                    </label>
                    <Input 
                      {...register("password")}
                      type="password" 
                      placeholder="••••••••" 
                      className={`h-12 rounded-xl border-slate-200 ${errors.password ? "border-brand-red" : ""}`} 
                    />
                    {password && (
                      <div className="flex gap-1 h-1 mt-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className={`flex-1 rounded-full ${strength >= i ? "bg-brand-green" : "bg-slate-200"}`} />
                        ))}
                      </div>
                    )}
                    {errors.password && <p className="text-xs text-brand-red font-bold">{errors.password.message}</p>}
                  </div>

                  {parseInt(age) >= 18 && (
                    <div className="flex items-center space-x-3 p-3 bg-brand-blue/5 rounded-xl border border-brand-blue/10 mt-2">
                      <Checkbox 
                        id="terms" 
                        checked={agreedToTerms} 
                        onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)} 
                      />
                      <label htmlFor="terms" className="text-xs text-slate-600 leading-tight cursor-pointer select-none">
                        I agree to the Terms & Privacy. I acknowledge that my data will be used to facilitate event registrations in my community.
                      </label>
                    </div>
                  )}

                  <div className="flex gap-4 pt-2">
                    <Button type="button" variant="outline" onClick={prevStep} className="flex-1 h-14 rounded-2xl text-lg gap-2">
                      <ChevronLeft size={20} /> Back
                    </Button>
                    <Button type="button" onClick={nextStep} 
                      className="flex-[2] h-14 bg-brand-blue hover:bg-brand-dark-blue rounded-2xl text-lg gap-2 shadow-lg shadow-brand-blue/20">
                      {parseInt(age) < 18 ? "Next Step" : "Complete"} <ChevronRight size={20} />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 3 && parseInt(age) < 18 && (
                <motion.div
                  key="step3"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-4"
                >
                  <div className="p-4 bg-brand-red/5 border border-brand-red/10 rounded-2xl mb-4">
                    <p className="text-sm font-bold text-brand-red flex items-center gap-2">
                      <AlertCircle size={18} /> Parental Consent Required
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Since you are under 18, we need information from your parent or legal guardian.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Parent/Guardian Name</label>
                      <Input 
                        {...register("parentName")}
                        placeholder="Full Name of Parent/Guardian" 
                        className={`h-12 rounded-xl border-slate-200 ${errors.parentName ? "border-brand-red" : ""}`} 
                      />
                      {errors.parentName && <p className="text-xs text-brand-red font-bold">{errors.parentName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Parent/Guardian Contact Number</label>
                      <Input 
                        {...register("parentContact")}
                        placeholder="Contact Number" 
                        className={`h-12 rounded-xl border-slate-200 ${errors.parentContact ? "border-brand-red" : ""}`} 
                      />
                      {errors.parentContact && <p className="text-xs text-brand-red font-bold">{errors.parentContact.message}</p>}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-brand-green/5 rounded-2xl border border-brand-green/10">
                    <Checkbox 
                      id="parent-consent" 
                      checked={agreedToTerms} 
                      onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)} 
                    />
                    <label htmlFor="parent-consent" className="text-sm text-slate-600 leading-tight cursor-pointer select-none">
                      I have my parent/guardian's permission to join CABarkada and I agree to the Terms and Privacy.
                    </label>
                  </div>

                  <div className="flex gap-4 pt-2">
                    <Button type="button" variant="outline" onClick={prevStep} className="flex-1 h-14 rounded-2xl text-lg gap-2">
                      <ChevronLeft size={20} /> Back
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="flex-[2] h-14 bg-brand-green hover:bg-brand-green/90 rounded-2xl text-lg gap-2 shadow-lg shadow-brand-green/20"
                    >
                      {loading ? <Loader2 className="animate-spin" /> : "Finish Registration"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
          
          <div className="mt-8 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link to="/login" className="text-brand-blue font-bold hover:underline">
              Login here
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Registration Success Modal */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] p-10 border-none shadow-2xl bg-white">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green">
              <CheckCircle2 size={48} />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-3xl font-black text-slate-900">Registration Successful!</DialogTitle>
              <DialogDescription className="text-lg text-slate-600">
                Welcome to the CABarkada! Your account has been created successfully.
              </DialogDescription>
            </div>
            <Button 
              onClick={handleSuccessNext}
              className="w-full h-14 bg-brand-green hover:bg-brand-green/90 rounded-2xl text-lg font-bold shadow-lg shadow-brand-green/20"
            >
              Next: Personalize Your Experience
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Onboarding / Interests Modal */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="sm:max-w-xl rounded-[2.5rem] p-0 border-none shadow-2xl bg-white overflow-hidden">
          <div className="p-10 space-y-8">
            <div className="space-y-2 text-center">
              <DialogTitle className="text-3xl font-black text-slate-900">What are you into?</DialogTitle>
              <DialogDescription className="text-lg text-slate-600">
                Select categories you're interested in so we can show you the best events first.
              </DialogDescription>
            </div>

            <ScrollArea className="h-[300px] pr-4">
              <div className="grid grid-cols-2 gap-4">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleInterest(cat.id)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                      selectedInterests.includes(cat.id)
                        ? "border-brand-blue bg-brand-blue/5 text-brand-blue shadow-md"
                        : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      selectedInterests.includes(cat.id) ? "bg-brand-blue text-white" : "bg-white text-slate-400"
                    }`}>
                      <cat.icon size={20} />
                    </div>
                    <span className="font-bold">{cat.name}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-4">
              <Button 
                variant="ghost"
                onClick={handleOnboardingComplete}
                className="flex-1 h-14 rounded-2xl text-lg font-bold text-slate-400 hover:text-slate-600"
              >
                Skip for now
              </Button>
              <Button 
                onClick={handleOnboardingComplete}
                disabled={loading}
                className="flex-[2] h-14 bg-brand-blue hover:bg-brand-dark-blue rounded-2xl text-lg font-bold shadow-lg shadow-brand-blue/20"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  selectedInterests.length > 0 ? `Show me ${selectedInterests.length} categories` : "Let's Go!"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
