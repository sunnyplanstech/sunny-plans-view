import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

type Props = {
  className?: string;
};

const ThemeToggle = ({ className = "" }: Props) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // next-themes resolves the active theme on the client; render a neutral
  // placeholder during SSR/first paint to avoid a hydration mismatch.
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const next = isDark ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className={`p-2 rounded-md text-foreground/80 hover:text-foreground hover:bg-muted transition-colors ${className}`}
    >
      {mounted ? (
        isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5 opacity-0" />
      )}
    </button>
  );
};

export default ThemeToggle;
