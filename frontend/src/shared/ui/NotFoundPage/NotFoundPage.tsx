"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Button, Title, Text, Stack, Box } from "@mantine/core";
import { IconPill } from "@tabler/icons-react";

/** Matrix-style characters for rain effect */
const MATRIX_CHARS =
  "ァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモャヤュユョヨラリルレロヮワヰヱヲンヴヵヶ0123456789";

/** Classic Matrix movie quotes */
const MATRIX_QUOTES = [
  "There is no spoon.",
  "Wake up, Neo...",
  "The Matrix has you.",
  "Follow the white rabbit.",
  "You take the red pill, you stay in Wonderland.",
  "What is real? How do you define 'real'?",
  "Free your mind.",
  "I know kung fu.",
  "Déjà vu is a glitch in the Matrix.",
  "Unfortunately, no one can be told what the Matrix is.",
] as const;

/** Rain column configuration */
interface RainDrop {
  readonly id: number;
  readonly left: number;
  readonly delay: number;
  readonly duration: number;
  readonly chars: string;
}

/** Number of rain columns */
const RAIN_COLUMNS = 50;

/** Glitch interval in ms */
const GLITCH_INTERVAL = 200;

/** Glitch probability (0-1) */
const GLITCH_PROBABILITY = 0.7;

/** Generates a random Matrix character */
const getRandomChar = (): string =>
  MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];

/** Generates rain drop configuration */
const generateRainDrops = (): RainDrop[] =>
  Array.from({ length: RAIN_COLUMNS }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 3 + Math.random() * 7,
    chars: Array.from({ length: 20 }, getRandomChar).join(""),
  }));

/** Picks a random quote */
const getRandomQuote = (): string =>
  MATRIX_QUOTES[Math.floor(Math.random() * MATRIX_QUOTES.length)];

/** ASCII art terminal box */
const ASCII_ART = `
      ████████████████████████████████████
      █                                  █
      █   ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄   █
      █   █ LOCATION NOT FOUND IN    █   █
      █   █ THE MATRIX. THIS PATH    █   █
      █   █ DOES NOT EXIST.          █   █
      █   █                          █   █
      █   █ > REALITY IS AN ILLUSION █   █
      █   █ > THE PATH IS WRONG      █   █
      █   █ > THERE IS NO PAGE       █   █
      █   ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀   █
      █                                  █
      ████████████████████████████████████
`;

/**
 * Matrix-themed 404 Not Found page component.
 *
 * Features:
 * - Falling Matrix rain effect background
 * - Glitching 404 title with RGB aberration
 * - Random Matrix movie quotes
 * - ASCII art terminal box
 * - Red pill navigation button
 */
export const NotFoundPage = () => {
  const [glitchText, setGlitchText] = useState("404");

  // Memoize static data to prevent recreation on re-renders
  const quote = useMemo(getRandomQuote, []);
  const rainDrops = useMemo(generateRainDrops, []);

  // Glitch effect interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > GLITCH_PROBABILITY) {
        const glitched = "404"
          .split("")
          .map((char) => (Math.random() > 0.5 ? getRandomChar() : char))
          .join("");
        setGlitchText(glitched);
        setTimeout(() => setGlitchText("404"), 100);
      }
    }, GLITCH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box className="not-found">
      {/* Matrix Rain Background */}
      <Box className="not-found__rain">
        {rainDrops.map((drop) => (
          <Text
            key={drop.id}
            component="span"
            className="not-found__rain-column"
            style={{
              left: `${drop.left}%`,
              animationDelay: `${drop.delay}s`,
              animationDuration: `${drop.duration}s`,
            }}
          >
            {drop.chars}
          </Text>
        ))}
      </Box>

      <Stack align="center" gap="xl" className="not-found__content">
        {/* Glitching 404 */}
        <Title order={1} className="not-found__title" data-text={glitchText}>
          {glitchText}
        </Title>

        <Text className="not-found__subtitle">SYSTEM FAILURE</Text>

        {/* ASCII Art Terminal Box */}
        <Box className="not-found__ascii">
          <Box component="pre">{ASCII_ART}</Box>
        </Box>

        {/* Random Quote */}
        <Text className="not-found__quote">&ldquo;{quote}&rdquo;</Text>

        <Button
          component={Link}
          href="/"
          leftSection={<IconPill size={18} />}
          className="not-found__btn"
        >
          TAKE THE RED PILL
        </Button>

        <Text className="not-found__hint">
          <Text component="span" className="not-found__cursor">
            █
          </Text>{" "}
          Press to return to reality...
        </Text>
      </Stack>
    </Box>
  );
};
