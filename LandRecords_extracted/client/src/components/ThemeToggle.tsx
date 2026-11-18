'use client';

import { useEffect, useState } from "react";
import { FiMoon, FiSun } from "react-icons/fi";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const syncTheme = () => {
      const savedDark = window.localStorage.getItem("landrecords-theme") === "dark";
      setDark(savedDark);
      document.documentElement.dataset.theme = savedDark ? "dark" : "light";
    };

    syncTheme();
    window.addEventListener("landrecords-theme-change", syncTheme);
    return () => window.removeEventListener("landrecords-theme-change", syncTheme);
  }, []);

  const toggle = () => {
    const nextDark = !dark;
    setDark(nextDark);
    document.documentElement.dataset.theme = nextDark ? "dark" : "light";
    window.localStorage.setItem("landrecords-theme", nextDark ? "dark" : "light");
    window.dispatchEvent(new Event("landrecords-theme-change"));
  };

  return (
    <button
      type="button"
      className="site-theme-toggle"
      onClick={toggle}
      aria-label={dark ? "Switch to light appearance" : "Switch to dark appearance"}
      title={dark ? "Switch to light appearance" : "Switch to dark appearance"}
    >
      {dark ? <FiSun aria-hidden="true" /> : <FiMoon aria-hidden="true" />}
      <span>{dark ? "Light" : "Dark"}</span>
    </button>
  );
}
