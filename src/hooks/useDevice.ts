"use client";
import { useEffect, useState } from "react";

export function useDevice(): "PC" | "Mobile" {
  const [device, setDevice] = useState<"PC" | "Mobile">("PC");
  useEffect(() => {
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    setDevice(isMobile ? "Mobile" : "PC");
  }, []);
  return device;
}
