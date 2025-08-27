import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, Rocket, Sparkles, Key } from "lucide-react";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { login, isLoggingIn } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    login(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-purple-600 via-blue-500 to-cyan-400">
      <div className="w-full max-w-md space-y-8 bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-xl">
        {/* Enhanced Dynamic Logo */}
        <div className="text-center mb-12">
          <div className="flex flex-col items-center">
            <div className="relative">
              {/* Main circle with enhanced effects */}
              <div className="size-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center 
                            shadow-lg relative overflow-hidden group">
                {/* Animated gradient overlay with enhanced colors */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 
                              opacity-40 group-hover:opacity-60 transition-all duration-700"></div>
                
                {/* Animated rings with different speeds */}
                <div className="absolute inset-0">
                  <div className="absolute inset-0 border-2 border-white/30 rounded-full animate-[spin_12s_linear_infinite]"></div>
                  <div className="absolute inset-3 border-2 border-white/20 rounded-full animate-[spin_8s_linear_infinite_reverse]"></div>
                  <div className="absolute inset-6 border-2 border-white/10 rounded-full animate-[spin_6s_linear_infinite]"></div>
                </div>
                
                {/* Glowing effect behind rocket */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 opacity-40 blur-xl animate-pulse"></div>
                
                {/* Center rocket icon with enhanced hover effect */}
                <div className="relative z-10 transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-500">
                  <Rocket className="size-12 text-white drop-shadow-lg" />
                </div>

                {/* Sparkles icon for additional effect */}
                <div className="absolute top-2 right-2 animate-pulse">
                  <Sparkles className="size-4 text-white/70" />
                </div>
              </div>
              
              {/* Enhanced floating particles */}
              <div className="absolute -inset-8 flex items-center justify-center">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className={`absolute size-${i % 2 ? 2 : 3} bg-white/40 rounded-full blur-sm`}
                    style={{
                      animation: `float ${2 + i}s infinite ease-in-out ${i * 0.3}s`,
                      left: `${50 + (i - 2.5) * 20}%`,
                      top: `${50 + (Math.sin(i) * 30)}%`,
                    }}
                  ></div>
                ))}
              </div>

              {/* Orbiting dots */}
              <div className="absolute inset-0">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={`orbit-${i}`}
                    className="absolute size-2 bg-white/50 rounded-full blur-sm"
                    style={{
                      animation: `orbit ${3 + i}s linear infinite ${i * 0.5}s`,
                      left: '50%',
                      top: '50%',
                    }}
                  ></div>
                ))}
              </div>
            </div>
            
            {/* Enhanced text with glow effect */}
            <div className="relative mt-8">
              <h1 className="text-4xl font-bold text-white drop-shadow-lg">Welcome Back</h1>
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-cyan-500 opacity-30 blur-lg -z-10"></div>
            </div>
            <p className="text-white/80 mt-3 text-lg">Sign in to your account</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium text-white">Email</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="size-5 text-white/60" />
              </div>
              <input
                type="email"
                className="input w-full pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 
                focus:bg-white/20 focus:border-white transition-all duration-300"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium text-white">Password</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="size-5 text-white/60" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                className="input w-full pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 
                focus:bg-white/20 focus:border-white transition-all duration-300"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/60 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
          </div>

          {/* Private Key Info */}
          <div className="rounded-lg bg-white/10 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Key className="size-5 text-cyan-300" />
              <h3 className="text-white font-medium">Private Key Feature</h3>
            </div>
            <p className="text-white/80 text-sm">
              Your private key will be available after login. You'll need it to start new conversations, and others will need your key to message you.
            </p>
          </div>

          <button 
            type="submit" 
            className="btn w-full bg-white/20 hover:bg-white/30 text-white border-0 
            backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]" 
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Loading...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-white/80">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="text-white hover:text-white/80 font-medium underline underline-offset-4">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
