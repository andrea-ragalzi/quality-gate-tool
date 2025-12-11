import type { Metadata } from "next";
// import { IBM_Plex_Mono } from "next/font/google";
import { MantineProvider, createTheme, ColorSchemeScript } from "@mantine/core";
import "@mantine/core/styles.css";
import "../styles/matrix.scss";
import { Providers } from "./providers";

// const ibmPlexMono = IBM_Plex_Mono({
//   weight: ["400", "600", "700"],
//   subsets: ["latin"],
//   display: "swap",
//   variable: "--font-ibm-plex-mono",
// });

const theme = createTheme({
  primaryColor: "green",
  fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
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
      "#0d0208", // --matrix-black (Main BG)
    ],
    green: [
      "#e6ffee",
      "#d3f9d8",
      "#a9f2b2",
      "#7ceb8b",
      "#57e56a",
      "#40e154",
      "#32df49",
      "#24c53a", // --matrix-green-dark
      "#1ab031",
      "#00ff41", // --matrix-green
    ],
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
      <body className={`crt terminal-boot`}>
        <MantineProvider theme={theme} defaultColorScheme="dark">
          <Providers>{children}</Providers>
        </MantineProvider>
      </body>
    </html>
  );
}
