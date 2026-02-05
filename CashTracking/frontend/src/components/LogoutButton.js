import React from "react";

const LogoutButton = () => {
  const handleLogout = () => {
    // Try server logout
    fetch("/cashtracking/api/logout", {
      credentials: "include",
    }).catch((err) => {
      console.error("Logout error", err);
    });

    // Always clear local storage (for static demo) and redirect
    localStorage.removeItem("cashtracking_user");
    window.location.href = "/cashtracking/login";
  };

  return <button className="logout-btn" onClick={handleLogout}>Logout</button>;
};

export default LogoutButton;