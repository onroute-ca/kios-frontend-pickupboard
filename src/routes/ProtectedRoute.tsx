import { Navigate, Outlet } from "react-router-dom";
import { LOGIN } from "./routes";
import { useAppSelector } from "../store/hooks";

export const ProtectedRoute = () => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to={LOGIN} replace />;
  }
  return <Outlet />;
};

