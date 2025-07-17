// src/pages/OAuthCallback.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const OAuthCallback = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const email = params.get("email");
    const name = params.get("name");
    const isAdmin = params.get("is_admin") === "true";
    const employeeId = params.get("employee_id");
    const id = Number(params.get("id"));

    if (token && email) {
      // Simulate a user login to store user/token properly
      const user = {
        id,
        email,
        username: name,
        full_name: name,
        is_admin: isAdmin,
        employee_id: employeeId,
      };

      localStorage.setItem("quiz_token", token);
      localStorage.setItem("quiz_user", JSON.stringify(user));
      window.location.href = isAdmin ? "/admin" : "/dashboard";  // hard redirect to reload auth state
    } else {
      console.error("OAuth failed. Missing params.");
      navigate("/login");
    }
  }, []);

  return <div>Signing in via Google...</div>;
};

export default OAuthCallback;
