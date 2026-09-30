import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { MAIN_ROUTE, LOGIN } from "./routes/routes";

const Login = lazy(() => import("./pages/auth/Login"));
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));

// Loading component for Suspense fallback
const Loading = () => (
  <div className="flex h-screen w-full items-center justify-center">Loading...</div>
);

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <BrowserRouter>
        <Routes>
          <Route path={LOGIN} element={<Login />} />
          <Route path={MAIN_ROUTE} element={<Dashboard />} />
          <Route path="*" element={<Navigate to={LOGIN} replace />} />
        </Routes>
      </BrowserRouter>
    </Suspense>
  );
}

export default App;
