import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { IconButton } from "@mui/material";
import logo from "../../assets/onroute-logo.svg";
import { CustomTextField } from "../../components/FormFields";
import { CustomButton } from "../../components/CustomButton";
import { MAIN_ROUTE } from "../../routes/routes";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [formErrors, setFormErrors] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  // Simulated loading states based on your snippet
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleStandardLogin = () => {
    // Basic validation example
    if (!formData.email) {
      setFormErrors((prev) => ({ ...prev, email: "Email is required" }));
      return;
    }
    if (!formData.password) {
      setFormErrors((prev) => ({ ...prev, password: "Password is required" }));
      return;
    }

    setIsLoginLoading(true);
    // Simulate authentication API call
    setTimeout(() => {
      setIsLoginLoading(false);
      navigate(MAIN_ROUTE);
    }, 1000);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50">
      {/* Decorative background shapes utilizing the brand color */}
      <div className="bg-brand/10 absolute top-0 left-0 -z-0 h-1/2 w-full origin-top-left -skew-y-6 transform"></div>

      <div className="z-10 mx-4 w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-xl backdrop-blur-sm">
        <div className="mb-4 flex flex-col items-center gap-8">
          <div className="inline-flex items-center justify-center">
            <img src={logo} alt="Onroute Logo" className="h-12 w-auto object-contain" />
          </div>
          <div className="flex flex-col items-center">
            <h1 className="text-2xl font-bold text-slate-800">Welcome Back</h1>
            <p className="mt-1 text-center text-sm text-slate-500">
              Enter your credentials to access the pickupboard control center
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleStandardLogin();
          }}
          className="flex flex-col gap-4"
        >
          <CustomTextField
            label="Email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
            error={!!formErrors.email}
            errorText={formErrors.email}
          />

          <div className="flex flex-col justify-center">
            <CustomTextField
              label="Password"
              name="password"
              required
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              error={!!formErrors.password}
              errorText={formErrors.password}
              endIcon={
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  size="small"
                  tabIndex={-1}
                  sx={{ p: 0.5, color: "#64748b" }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </IconButton>
              }
            />
          </div>

          <button type="submit" style={{ display: "none" }} />
          <CustomButton
            label="Login"
            variant="contained"
            loading={isLoginLoading}
            dotLoader
            onClick={() => handleStandardLogin()}
            sx={{ width: "100%", mt: 1 }}
          />
        </form>
      </div>
    </div>
  );
}
