import React from "react";

const LogoutButton = () => {
  const handleLogout = () => {
    fetch("/cashtracking/api/logout", {
      credentials: "include",
    })
      .then(() => {
        window.location.href = "/login";
      })
      .catch((err) => {
        console.error("Logout error", err);
      });
  };

  return <button className="logout-btn" onClick={handleLogout}>Logout</button>;
};

export default LogoutButton;