import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { IconButton } from "@mui/material";
import logo from "../../assets/onroute-logo.svg";
import { CustomTextField } from "../../components/FormFields";
import { CustomButton } from "../../components/CustomButton";
import { MAIN_ROUTE } from "../../routes/routes";
import { useLoginMutation } from "../../services/auth/authService";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { loginSuccess } from "../../store/authSlice";
import { toast } from "react-toastify";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [formErrors, setFormErrors] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const { mutate: loginMutation, isPending: isLoginLoading } = useLoginMutation();

  // If already authenticated, redirect to board
  useEffect(() => {
    if (isAuthenticated) {
      navigate(MAIN_ROUTE, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleStandardLogin = async () => {
    // Basic validation example
    if (!formData.username) {
      setFormErrors((prev) => ({ ...prev, username: "Username is required" }));
      return;
    }
    if (!formData.password) {
      setFormErrors((prev) => ({ ...prev, password: "Password is required" }));
      return;
    }

    const payload = {
      username: formData.username,
      password: formData.password,
      deviceType: "DISPLAY",
    };

    loginMutation(payload, {
      onSuccess: (data) => {
        // Save data to Redux Store
        dispatch(
          loginSuccess({
            authToken: data.accessToken,
            refreshToken: data.refreshToken,
            expiresAt: data.accessTokenExpiry,
            refreshTokenExpiresAt: data.refreshTokenExpiry,
            username: data.username,
            storeId: data.posStoreId,
            storeName: data.storeName,
            plazaId: data.plazaId,
            plazaName: data.plazaName,
            deviceId: data.deviceId,
            pinpadIp: data.pinpadIp,
            pinpadPort: data.pinpadPort,
            printerIp: data.printerIp,
            printerPort: data.printerPort,
            kioskSerialNo: data.kioskSerialNo,
            idleCarouselTimeout: data.idleCarouselTimeout,
          }),
        );
        toast.success("Login successful!");

        navigate(MAIN_ROUTE);
      },
      onError: (err) => {
        console.error("Login Error:", err);
      },
    });
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
            label="Username"
            name="username"
            type="text"
            placeholder="Enter your username"
            value={formData.username}
            onChange={handleChange}
            required
            error={!!formErrors.username}
            errorText={formErrors.username}
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
                  aria-label={showPassword ? "Hide password" : "Show password"}
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
};

export default Login;
