import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MAIN_ROUTE, LOGIN } from "./routes/routes";
import { ProtectedRoute } from "./routes/ProtectedRoute";

const Login = lazy(() => import("./pages/auth/Login"));
const PickupBoard = lazy(() => import("./pages/pickup-board/PickupBoard"));

// Loading component for Suspense fallback
const Loading = () => (
  <div className="flex h-screen w-full items-center justify-center">Loading...</div>
);

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path={LOGIN} element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path={MAIN_ROUTE} element={<PickupBoard />} />
          </Route>
          <Route path="*" element={<Navigate to={LOGIN} replace />} />
        </Routes>
      </BrowserRouter>
    </Suspense>
  );
}

export default App;


