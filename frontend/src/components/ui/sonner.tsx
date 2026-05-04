import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--error-bg": "#fef2f2",
          "--error-text": "#dc2626",
          "--error-border": "#dc2626",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          error: "bg-green-950 border-2 border-green-700 text-green-100 font-semibold shadow-lg",
          success: "bg-green-50 border border-green-200 text-green-700",
          warning: "bg-green-50 border border-green-200 text-green-700",
          info: "bg-green-50 border border-green-200 text-green-700",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };


