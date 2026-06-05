import { useState } from "react"; 
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, User, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  
  // Toggle between 'login' and 'signup' modes
  const [mode, setMode] = useState("login"); 
  
  // Form states
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); 
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(""); 

    const registeredUsers = JSON.parse(localStorage.getItem("localAccounts") || "[]");
    const targetEmail = email.trim().toLowerCase();

    if (mode === "signup") {
      // 1. Instant validation: check local cache array first
      const userExists = registeredUsers.some(u => u.email.toLowerCase() === targetEmail);
      if (userExists) {
        setError("An account with this email already exists!");
        return;
      }

      // 2. HTTP POST dispatch to your live User Service backend
      fetch("http://localhost:3001/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: targetEmail })
      })
        .then((res) => {
          if (!res.ok) {
            return res.json().then(errData => {
              throw new Error(errData.error || "Backend registration failed");
            });
          }
          return res.json();
        })
        .then((savedUser) => {
          // 3. Complete system profile using the real database _id
          const newAccount = {
            _id: savedUser._id, // Real permanent MongoDB ID mapping
            name: savedUser.name,
            email: savedUser.email,
            password: password // Safe local state check tracking string
          };

          // Cache credentials inside local account vault
          registeredUsers.push(newAccount);
          localStorage.setItem("localAccounts", JSON.stringify(registeredUsers));

          // Set active browser login context context session
          localStorage.setItem("currentUser", JSON.stringify({ _id: newAccount._id, name: newAccount.name, email: newAccount.email }));
          navigate("/dashboard");
        })
        .catch((err) => {
          console.error("User Service endpoint failure:", err);
          setError(err.message || "Failed to reach User Service backend. Verify your Docker container is online.");
        });

    } else {
      // Mode is 'login' -> Match local credentials
      const matchedUser = registeredUsers.find(u => u.email.toLowerCase() === targetEmail);
      
      if (!matchedUser) {
        setError("No account found with this email. Please sign up first!");
        return;
      }

      if (matchedUser.password !== password) {
        setError("Incorrect password! Please try again.");
        return;
      }

      // Save valid active profile context session state
      localStorage.setItem("currentUser", JSON.stringify({ _id: matchedUser._id, name: matchedUser.name, email: matchedUser.email }));
      navigate("/dashboard");
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setEmail("");
    setName("");
    setPassword("");
    setShowPassword(false); 
    setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-rose-50 to-pink-200 overflow-hidden relative">
      
      {/* Background Glow Ring Elements */}
      <div className="absolute top-[-120px] left-[-100px] w-[300px] h-[300px] bg-pink-300 rounded-full blur-3xl opacity-30" />
      <div className="absolute bottom-[-120px] right-[-100px] w-[300px] h-[300px] bg-rose-300 rounded-full blur-3xl opacity-30" />

      <motion.div
        layout
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-[90%] max-w-md backdrop-blur-xl bg-white/60 border border-white/40 shadow-2xl rounded-3xl p-8 z-10"
      >
        
        {/* Header Text */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 transition-all">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            {mode === "login" 
              ? "Login to manage your tasks beautifully" 
              : "Join the workspace pipeline in seconds"}
          </p>
        </div>

        {/* Dynamic Error Banner Notification */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-4 p-3 bg-red-50 border border-red-100 text-red-500 text-xs font-semibold rounded-xl"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Interface Processing Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Dynamic Field: Full Name */}
          <AnimatePresence mode="wait">
            {mode === "signup" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <label className="text-sm text-gray-600 font-medium">Full Name</label>
                <div className="mt-1.5 flex items-center bg-white rounded-xl px-4 border border-pink-100 focus-within:border-pink-400 transition-all">
                  <User className="text-pink-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-4 outline-none bg-transparent text-gray-700 text-sm"
                    required={mode === "signup"}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email Element */}
          <div>
            <label className="text-sm text-gray-600 font-medium">Email</label>
            <div className="mt-1.5 flex items-center bg-white rounded-xl px-4 border border-pink-100 focus-within:border-pink-400 transition-all">
              <Mail className="text-pink-400 w-5 h-5" />
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-4 outline-none bg-transparent text-gray-700 text-sm"
                required
              />
            </div>
          </div>

          {/* Password Element with Show/Hide Eye Toggle */}
          <div>
            <label className="text-sm text-gray-600 font-medium">Password</label>
            <div className="mt-1.5 flex items-center bg-white rounded-xl px-4 border border-pink-100 focus-within:border-pink-400 transition-all justify-between">
              <div className="flex items-center flex-1">
                <Lock className="text-pink-400 w-5 h-5 flex-shrink-0" />
                <input
                  type={showPassword ? "text" : "password"} 
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-4 outline-none bg-transparent text-gray-700 text-sm"
                  required
                />
              </div>
              
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-pink-500 focus:outline-none cursor-pointer transition-colors mr-1"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Forgot Password Helper — only shows up during Login mode */}
          {mode === "login" && (
            <div className="flex justify-end pt-1">
              <button type="button" className="text-xs text-pink-500 hover:text-pink-600 font-medium transition cursor-pointer">
                Forgot Password?
              </button>
            </div>
          )}

          {/* Action Execution Submit Trigger Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="w-full bg-gradient-to-r from-pink-400 to-rose-400 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-pink-200 transition-all cursor-pointer mt-2"
          >
            {mode === "login" ? "Login" : "Sign Up"}
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </form>

        {/* Footer Navigation Link Toggle Switches */}
        <p className="text-center text-gray-500 text-sm mt-6">
          {mode === "login" ? "Don’t have an account?" : "Already have an account?"}
          <button
            type="button"
            onClick={toggleMode}
            className="text-pink-500 font-semibold cursor-pointer ml-1.5 hover:text-pink-600 underline transition-all bg-transparent border-none"
          >
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}