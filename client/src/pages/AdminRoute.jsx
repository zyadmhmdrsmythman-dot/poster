import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import api from "../api/axios.js";
import Loading from "../components/Loading.jsx";
import AdminDashboard from "./AdminDashboard.jsx";

const AdminRoute = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [access, setAccess] = useState("checking");

  useEffect(() => {
    if (!isLoaded) return undefined;
    let active = true;
    const onAdminRoleChanged = (event) => {
      if (event.detail?.isAdmin === false && active) setAccess("denied");
    };
    window.addEventListener("platform-admin-changed", onAdminRoleChanged);
    if (!isSignedIn) {
      setAccess("denied");
      return () => {
        active = false;
        window.removeEventListener("platform-admin-changed", onAdminRoleChanged);
      };
    }

    const verifyAccess = async () => {
      try {
        const token = await getToken();
        if (!token) {
          if (active) setAccess("denied");
          return;
        }
        await api.get("/api/admin/overview", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (active) setAccess("allowed");
      } catch {
        if (active) setAccess("denied");
      }
    };

    verifyAccess();
    return () => {
      active = false;
      window.removeEventListener("platform-admin-changed", onAdminRoleChanged);
    };
  }, [getToken, isLoaded, isSignedIn]);

  if (access === "checking") return <Loading />;
  if (access === "denied") return <Navigate to="/" replace />;
  return <AdminDashboard />;
};

export default AdminRoute;
