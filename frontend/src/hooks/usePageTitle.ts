import { useEffect } from "react";

export function usePageTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = title || prev;
    return () => {
      document.title = prev;
    };
  }, [title]);
}
