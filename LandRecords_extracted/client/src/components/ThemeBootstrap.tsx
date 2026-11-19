'use client';

import { useEffect } from "react";

export default function ThemeBootstrap() {
  useEffect(() => {
    const savedTheme = window.localStorage.getItem("landrecords-theme");
    document.documentElement.dataset.theme = savedTheme === "dark" ? "dark" : "light";
  }, []);

  return null;
}
