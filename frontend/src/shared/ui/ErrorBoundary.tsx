"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button, Container, Title, Text, Code } from "@mantine/core";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Container className="error-boundary">
          <Title order={1} c="red">
            Something went wrong
          </Title>
          <Text mt="md">The application crashed with the following error:</Text>
          <Code block mt="md" color="red">
            {this.state.error?.toString() || "Unknown Error"}
          </Code>
          <Button mt="xl" onClick={() => window.location.reload()}>
            Reload Application
          </Button>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
