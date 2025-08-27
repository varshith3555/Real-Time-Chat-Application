import { MessageSquare, Rocket, Sparkles, Zap, Search, Mail, User, Lock } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

const NoChatSelected = () => {
  const { authUser } = useAuthStore();
  
  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-16 
                    bg-gradient-to-br from-purple-600/10 via-blue-500/5 to-cyan-400/10 
                    relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-blue-500/5" />
      
      {/* Animated Circles */}
      <div className="absolute inset-0">
        {[...Array(3)].map((_, i) => (
          <div
            key={`circle-${i}`}
            className="absolute rounded-full mix-blend-overlay filter blur-xl opacity-30 animate-pulse-slow"
            style={{
              width: `${300 + i * 100}px`,
              height: `${300 + i * 100}px`,
              background: `radial-gradient(circle, ${i % 2 ? '#7c3aed' : '#06b6d4'} 0%, transparent 70%)`,
              top: `${50 + Math.sin(i) * 10}%`,
              left: `${50 + Math.cos(i) * 10}%`,
              transform: 'translate(-50%, -50%)',
              animation: `pulse ${6 + i * 2}s infinite ease-in-out ${i * 1}s`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="max-w-4xl text-center space-y-12 relative z-10">
        {/* Logo and Title */}
        <div className="relative flex items-center justify-center gap-6">
          {/* Logo with Force Air Effect */}
          <div className="relative">
            <div className="relative bg-gradient-to-br from-purple-500/10 to-cyan-500/10 p-4 rounded-xl 
                           backdrop-blur-sm border border-white/10 group">
              {/* Force Air Effects */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 -z-10">
                {/* Main thrust */}
                <div className="absolute right-2 w-12 h-3 bg-gradient-to-r from-purple-500/80 via-blue-500/50 to-transparent 
                               blur-md animate-thrust" />
                {/* Secondary particles */}
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute right-2 h-[2px] bg-gradient-to-r from-cyan-400/60 to-transparent blur-sm"
                    style={{
                      width: `${24 + i * 8}px`,
                      top: `${50 + (i - 1) * 30}%`,
                      transform: 'translateY(-50%)',
                      animation: `thrust ${0.8 + i * 0.2}s infinite ease-out`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>

              {/* Rocket Icon */}
              <div className="relative z-10 group-hover:scale-105 transition-transform duration-300">
                <Rocket className="w-12 h-12 text-white drop-shadow-glow" />
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                </div>
                <div className="absolute -bottom-1 -left-1">
                  <Zap className="w-4 h-4 text-purple-400 animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="relative">
            <h1 className="text-7xl font-bold tracking-tight flex items-center gap-4">
              <span className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 
                             text-transparent bg-clip-text animate-gradient">
                Socket
              </span>
              <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 
                             text-transparent bg-clip-text animate-gradient">
                Speak
              </span>
            </h1>
            {/* Title Glow */}
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-500/20 via-blue-500/20 
                           to-cyan-500/20 blur-2xl opacity-50 -z-10" />
          </div>
        </div>

        {/* Subtitle with enhanced styling */}
        <div className="space-y-6 animate-float">
          <p className="text-2xl text-white/80 leading-relaxed max-w-2xl mx-auto font-light">
            Connect and chat in real-time with your friends and colleagues.
          </p>
          
          {/* Private Key Info */}
          <div className="max-w-md mx-auto p-4 rounded-xl 
                        bg-gradient-to-br from-blue-500/10 to-transparent 
                        border border-blue-400/20 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500/20 rounded-full">
                <Lock className="w-5 h-5 text-blue-300" />
              </div>
              <h4 className="text-lg text-white/90 font-medium">Your Private Key</h4>
            </div>
            
            <p className="text-white/70 text-sm mb-3">
              Share your private key with others so they can start conversations with you:
            </p>
            
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 font-mono text-cyan-300">
              {authUser?.privateKey || "Loading..."}
            </div>
            
            <p className="text-white/60 text-xs mt-2">
              You'll need to enter someone's private key when starting a new conversation with them
            </p>
          </div>
          
          {/* How to use */}
          <div className="max-w-2xl mx-auto space-y-4">
            <h3 className="text-xl text-white/90 font-medium">How to start a conversation:</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Step 1 */}
              <div className="flex flex-col items-center gap-3 p-4 rounded-xl 
                            bg-gradient-to-br from-purple-500/10 to-transparent 
                            border border-white/10 backdrop-blur-sm">
                <div className="p-3 bg-purple-500/20 rounded-full">
                  <Search className="w-6 h-6 text-purple-300" />
                </div>
                <h4 className="text-white/90 font-medium">Search by Email</h4>
                <p className="text-white/60 text-sm">
                  Use the search bar to find users by their email address
                </p>
              </div>
              
              {/* Step 2 */}
              <div className="flex flex-col items-center gap-3 p-4 rounded-xl 
                            bg-gradient-to-br from-blue-500/10 to-transparent 
                            border border-white/10 backdrop-blur-sm">
                <div className="p-3 bg-blue-500/20 rounded-full">
                  <Lock className="w-6 h-6 text-blue-300" />
                </div>
                <h4 className="text-white/90 font-medium">Enter Private Key</h4>
                <p className="text-white/60 text-sm">
                  You'll need their private key to start a new conversation
                </p>
              </div>
              
              {/* Step 3 */}
              <div className="flex flex-col items-center gap-3 p-4 rounded-xl 
                            bg-gradient-to-br from-blue-500/10 to-transparent 
                            border border-white/10 backdrop-blur-sm">
                <div className="p-3 bg-blue-500/20 rounded-full">
                  <User className="w-6 h-6 text-blue-300" />
                </div>
                <h4 className="text-white/90 font-medium">Add Contact</h4>
                <p className="text-white/60 text-sm">
                  Start a conversation with secure private key verification
                </p>
              </div>
              
              {/* Step 4 */}
              <div className="flex flex-col items-center gap-3 p-4 rounded-xl 
                            bg-gradient-to-br from-cyan-500/10 to-transparent 
                            border border-white/10 backdrop-blur-sm">
                <div className="p-3 bg-cyan-500/20 rounded-full">
                  <Mail className="w-6 h-6 text-cyan-300" />
                </div>
                <h4 className="text-white/90 font-medium">Send Messages</h4>
                <p className="text-white/60 text-sm">
                  Exchange text and images in your private conversation
                </p>
              </div>
            </div>
            
            <div className="mt-6 inline-flex items-center gap-3 px-6 py-3 rounded-full 
                          bg-gradient-to-r from-purple-500/10 to-cyan-500/10 
                          border border-white/10 backdrop-blur-sm">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              <span className="text-white/70">Press Ctrl+K (or Cmd+K) to quickly search for users</span>
            </div>
          </div>
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                background: `${i % 2 ? 'rgb(147, 51, 234)' : 'rgb(59, 130, 246)'}`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: 0.3,
                animation: `float ${3 + Math.random() * 4}s infinite ease-in-out ${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default NoChatSelected;

