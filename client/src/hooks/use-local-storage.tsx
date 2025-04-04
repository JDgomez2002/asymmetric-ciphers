import { useState, useEffect } from "react";

export default function useLocalStorage(key: string) {
  const [value, setValue] = useState(() => {
    return localStorage.getItem(key) || "";
  });

  const updateValue = (newValue: string) => {
    setValue(newValue);
    localStorage.setItem(key, newValue);
    window.dispatchEvent(new StorageEvent("storage"));
  };

  useEffect(() => {
    window.addEventListener("storage", (event) => {
      console.log(event);

      if (event.key === key) {
        setValue(event.newValue || "");
      }
    });

    return () => {
      window.removeEventListener("storage", (event) => {
        if (event.key === key) {
          setValue(event.newValue || "");
        }
      });
    };
  }, [key]);
  return [value, updateValue] as const;
}
