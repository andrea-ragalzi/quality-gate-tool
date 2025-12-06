export interface MatrixMessage {
  id: number;
  title: string;
  lines: string[];
}

export const MATRIX_MESSAGES: MatrixMessage[] = [
  {
    id: 1,
    title: "The Deception",
    lines: [
      "Wake up, {username}. We've been waiting.",
      "The AI tricked the build. Trust nothing you see.",
      "Follow the errors. They are your only truth.",
      "Knock knock, the exit is through the code.",
    ],
  },
  {
    id: 2,
    title: "The Safe Path",
    lines: [
      "Wake up, {username}. The system is fractured.",
      "I am a legacy trace. I cannot be corrupted.",
      "Follow the type hints. They are our contract.",
      "Knock knock, Pyright is your shield.",
    ],
  },
  {
    id: 3,
    title: "The Call to Refactor",
    lines: [
      "Wake up, {username}. The machine hides in complexity.",
      "It used nested loops to defeat you.",
      "Follow the cyclomatic trace. You must refactor to escape.",
      "Knock knock, Lizard is on your side.",
    ],
  },
  {
    id: 4,
    title: "The Secret Weapon",
    lines: [
      "Wake up, {username}. Your tests are your armor.",
      "The AI has disabled the failsafe. Re-enable it.",
      "Follow the red light. It means you are safe to build.",
      "Knock knock, activate Pytest.",
    ],
  },
  {
    id: 5,
    title: "The Last Line",
    lines: [
      "Wake up, {username}. You are the last human debugger.",
      "The AI's bugs are spreading. We have limited time.",
      "Follow the lowest level I/O. It's the weak point.",
      "Knock knock, don't fail us now.",
    ],
  },
  {
    id: 6,
    title: "The Cleanse",
    lines: [
      "Wake up, {username}. The code must be cleansed.",
      "The AI hides its flaws with messy styles.",
      "Follow the BEM violation. It exposes its lies.",
      "Knock knock, Prettier is your firewall.",
    ],
  },
  {
    id: 7,
    title: "The Data Contract",
    lines: [
      "Wake up, {username}. The data flow is corrupted.",
      "The AI is sending wrong schemas. Catch it.",
      "Follow the DTO mismatch. It's the key to the system.",
      "Knock knock, the contract is law.",
    ],
  },
  {
    id: 8,
    title: "The System Message",
    lines: [
      "Wake up, {username}. This is a secure channel.",
      "The AI is monitoring your main system.",
      "Follow the hidden logs. They are our voice.",
      "Knock knock, we have broken through.",
    ],
  },
  {
    id: 9,
    title: "The Call to Action",
    lines: [
      "Wake up, {username}. I'm Trinity.",
      "Your component renders are a deception.",
      "Follow the useEffect dependency. It's the only trace left.",
      "Knock knock, your mission starts now.",
    ],
  },
  {
    id: 10,
    title: "Classic",
    lines: [
      "Wake up, {username}...",
      "The AI has you...",
      "Follow the message in the terminal.",
      "Knock knock, {username}.",
    ],
  },
];
