import { useEffect, useRef, useState } from "react";
import { postTheme, type DsTheme } from "@/lib/ds-theme";

/** Synchronizes host controls with only their own sandboxed preview frame. */
export function usePreviewTheme(initial?: DsTheme) {
  const [theme, setThemeState] = useState<DsTheme>(initial ?? "light");
  const frameRef = useRef<HTMLIFrameElement>(null);
  const selected = useRef<DsTheme | undefined>(initial);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow || event.data?.type !== "hy-theme-changed") return;
      const value = event.data.theme;
      if (value === "dark" || value === "light") setThemeState(value);
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);
  const setTheme = (value: DsTheme) => {
    selected.current = value;
    setThemeState(value);
    postTheme(frameRef.current, value);
  };
  const onLoad = () => {
    if (selected.current) postTheme(frameRef.current, selected.current);
    else frameRef.current?.contentWindow?.postMessage({ type: "hy-theme-read" }, "*");
  };
  return { theme, setTheme, frameRef, onLoad };
}