import { useState } from "react";
import Auth from "./Auth.jsx";
import Planner from "./Planner.jsx";

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));

  const login = ({ token, user }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  };
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return user ? <Planner user={user} onLogout={logout} /> : <Auth onAuth={login} />;
}
