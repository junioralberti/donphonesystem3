
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator as CalculatorIcon } from "lucide-react";

export function CalculatorComponent() {
  const [displayValue, setDisplayValue] = useState("0");
  const [firstOperand, setFirstOperand] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false);

  const inputDigit = (digit: string) => {
    if (displayValue === "Error") {
      resetCalculator(); // Reset if previous state was error before new input
      setDisplayValue(digit);
      setWaitingForSecondOperand(false);
      return;
    }
    if (waitingForSecondOperand) {
      setDisplayValue(digit);
      setWaitingForSecondOperand(false);
    } else {
      setDisplayValue(displayValue === "0" ? digit : displayValue + digit);
    }
  };

  const inputDecimal = () => {
    if (displayValue === "Error") {
       resetCalculator();
       setDisplayValue("0.");
       setWaitingForSecondOperand(false);
       return;
    }
    if (waitingForSecondOperand) {
      setDisplayValue("0.");
      setWaitingForSecondOperand(false);
      return;
    }
    if (!displayValue.includes(".")) {
      setDisplayValue(displayValue + ".");
    }
  };

  const performOperation = (nextOperator: string) => {
    if (displayValue === "Error") return; // Don't allow operations if in error state

    const inputValue = parseFloat(displayValue);

    if (firstOperand === null) {
      setFirstOperand(inputValue);
    } else if (operator) {
      const result = calculate(firstOperand, inputValue, operator);
      if (isNaN(result)) { // Error from calculate (e.g. division by zero)
        setDisplayValue("Error");
        setFirstOperand(null);
        setOperator(null);
        setWaitingForSecondOperand(true); // Allow new input after error
        return;
      }
      setDisplayValue(String(parseFloat(result.toFixed(10)))); // Prevent long decimals
      setFirstOperand(result);
    }

    setWaitingForSecondOperand(true);
    setOperator(nextOperator);
  };

  const calculate = (
    operand1: number,
    operand2: number,
    op: string
  ): number => {
    switch (op) {
      case "+":
        return operand1 + operand2;
      case "-":
        return operand1 - operand2;
      case "*":
        return operand1 * operand2;
      case "/":
        if (operand2 === 0) {
          return NaN; // Signal error for division by zero
        }
        return operand1 / operand2;
      default:
        return operand2; 
    }
  };

  const handleEquals = () => {
    if (displayValue === "Error" || !operator || firstOperand === null) return;
    
    const inputValue = parseFloat(displayValue);
    const result = calculate(firstOperand, inputValue, operator);

    if (isNaN(result)) {
      setDisplayValue("Error");
    } else {
      setDisplayValue(String(parseFloat(result.toFixed(10))));
    }
    setFirstOperand(null); 
    setOperator(null);
    setWaitingForSecondOperand(true); 
  };

  const resetCalculator = () => {
    setDisplayValue("0");
    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecondOperand(false);
  };

  const buttons = [
    { label: "AC", handler: resetCalculator, className: "col-span-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground" },
    { label: "/", handler: () => performOperation("/"), className: "bg-accent hover:bg-accent/90" },
    { label: "*", handler: () => performOperation("*"), className: "bg-accent hover:bg-accent/90" },
    { label: "7", handler: () => inputDigit("7") },
    { label: "8", handler: () => inputDigit("8") },
    { label: "9", handler: () => inputDigit("9") },
    { label: "-", handler: () => performOperation("-"), className: "bg-accent hover:bg-accent/90" },
    { label: "4", handler: () => inputDigit("4") },
    { label: "5", handler: () => inputDigit("5") },
    { label: "6", handler: () => inputDigit("6") },
    { label: "+", handler: () => performOperation("+"), className: "bg-accent hover:bg-accent/90" },
    { label: "1", handler: () => inputDigit("1") },
    { label: "2", handler: () => inputDigit("2") },
    { label: "3", handler: () => inputDigit("3") },
    { label: "=", handler: handleEquals, className: "row-span-2 bg-primary hover:bg-primary/90 text-primary-foreground" },
    { label: "0", handler: () => inputDigit("0"), className: "col-span-2" },
    { label: ".", handler: inputDecimal },
  ];

  return (
    <Card className="w-full max-w-xs mx-auto shadow-lg border-none sm:border sm:rounded-lg">
      <CardHeader className="pt-4 pb-2 px-4 sm:px-6 sm:pt-6 sm:pb-3">
        <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
          <CalculatorIcon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          Calculadora
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="mb-4 h-16 flex items-center justify-end rounded-md border bg-muted px-4 py-2 text-3xl font-mono text-right overflow-x-auto">
          {displayValue}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {buttons.map((btn) => (
            <Button
              key={btn.label}
              onClick={btn.handler}
              variant={btn.className?.includes("bg-") ? "default" : "outline"}
              className={`text-xl h-14 sm:h-16 ${btn.className || ""}`}
              size="lg"
            >
              {btn.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
