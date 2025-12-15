import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { MantineProvider, createTheme, ColorSchemeScript } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "../styles/theme.scss";
import { Providers } from "./providers";
import classes from "../styles/base/MantineOverrides.module.scss";
import { UnhandledRejectionGuard } from "./UnhandledRejectionGuard";

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

const theme = createTheme({
  primaryColor: "green",
  fontFamily: "var(--font-jetbrains-mono), 'Courier New', monospace",
  colors: {
    dark: [
      "#C1C2C5",
      "#A6A7AB",
      "#909296",
      "#5c5f66",
      "#373A40",
      "#2C2E33",
      "#25262b",
      "#1a1a1d", // --matrix-dark (Panel BG)
      "#141517",
      "#0d0d0d", // --matrix-black (Main BG)
    ],
    green: [
      "#e6ffee",
      "#d3f9d8",
      "#a9f2b2",
      "#7ceb8b",
      "#57e56a",
      "#40e154",
      "#32df49",
      "#008f11", // --matrix-green-dim
      "#1ab031",
      "#00ff41", // --matrix-green
    ],
  },
  components: {
    Button: {
      classNames: {
        root: classes.buttonRoot,
      },
    },
    TextInput: {
      classNames: {
        input: classes.inputInput,
      },
    },
    Select: {
      classNames: {
        input: classes.inputInput,
        dropdown: classes.selectDropdown,
        option: classes.selectOption,
      },
    },
    Modal: {
      classNames: {
        overlay: classes.modalOverlay,
        content: classes.modalContent,
        header: classes.modalHeader,
        title: classes.modalTitle,
      },
    },
    Paper: {
      classNames: {
        root: classes.paperRoot,
      },
    },
    Badge: {
      classNames: {
        root: classes.badgeRoot,
      },
    },
    Loader: {
      classNames: {
        root: classes.loaderRoot,
      },
    },
  },
});

export const metadata: Metadata = {
  title: "Quality Gate Dashboard",
  description: "Real-time code quality analysis",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body className={`crt terminal-boot ${jetBrainsMono.variable}`}>
        <MantineProvider theme={theme} defaultColorScheme="dark">
          <Notifications position="bottom-right" zIndex={2000} />
          <UnhandledRejectionGuard />
          <Providers>{children}</Providers>
        </MantineProvider>
      </body>
    </html>
  );
}
