import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, Rocket, User, Sparkles } from "lucide-react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();

  return (
    <header className="fixed w-full top-0 z-40">
      <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-md"></div>
      
      <div className="container mx-auto h-16 relative">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              {/* Logo Container with animations */}
              <div className="relative">
                {/* Background glow effect */}
                <div className="absolute inset-0 bg-white/20 rounded-lg blur-xl group-hover:bg-white/30 transition-all duration-500"></div>
                
                {/* Main logo container */}
                <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center relative 
                             group-hover:bg-white/20 transition-all duration-300
                             shadow-lg shadow-purple-500/20">
                  
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/40 via-blue-500/40 to-cyan-400/40 
                               rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Rocket icon with rotation */}
                  <Rocket className="size-5 text-white transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" />
                  
                  {/* Sparkle effect */}
                  <div className="absolute -top-1 -right-1">
                    <Sparkles className="size-3 text-white/70 animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Brand name with gradient text */}
              <div className="relative">
                <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r 
                             from-white via-white to-white/70 group-hover:to-white 
                             transition-all duration-300">
                  SocketSpeak
                </h1>
                {/* Animated underline */}
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-white/40 
                              group-hover:w-full transition-all duration-300"></div>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {authUser && (
              <>
                <Link 
                  to={"/profile"} 
                  className="btn btn-sm gap-2 bg-white/10 hover:bg-white/20 text-white transition-all duration-300"
                >
                  <User className="size-4" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>

                <button
                  onClick={logout}
                  className="btn btn-sm gap-2 bg-white/10 hover:bg-white/20 text-white transition-all duration-300"
                >
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
export default Navbar;
