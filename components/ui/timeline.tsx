"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Card } from "./card";

export interface TimelineStep {
  id: number;
  label: string;
}

interface TimelineProps {
  steps: TimelineStep[];
  activeStep: number;
  onStepClick?: (stepId: number) => void;
}

export const Timeline = ({ steps, activeStep, onStepClick }: TimelineProps) => {
  return (
    <Card className="w-full">
      {/* Desktop version */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Barre de fond continue */}
          <div className="absolute top-4 left-4 right-4 h-1 bg-gray-200" />

          {/* Barre de progression verte */}
          <div
            className="absolute top-4 left-4 h-1 bg-green transition-all duration-500"
            style={{
              width: `calc(${(activeStep / (steps.length - 1)) * 100}% - ${
                (activeStep / (steps.length - 1)) * 2.5
              }rem)`,
            }}
          />

          <div className="flex items-start justify-between relative">
            {steps.map((step, index) => {
              const isActive = index === activeStep;
              const isCompleted = index < activeStep;
              const isClickable = index <= activeStep && onStepClick;

              return (
                <div
                  key={step.id}
                  className="flex flex-col items-center gap-2 relative z-10"
                >
                  <button
                    onClick={() => isClickable && onStepClick(index)}
                    disabled={!isClickable}
                    className={cn(
                      "w-8 h-8 rounded-full ring-10 ring-white flex items-center justify-center text-sm font-medium transition-all duration-300",
                      isCompleted &&
                        "bg-green text-black cursor-pointer hover:bg-black hover:text-green",
                      isActive &&
                        "bg-green text-black cursor-pointer hover:bg-black hover:text-green",
                      !isCompleted &&
                        !isActive &&
                        "bg-gray-200 text-gray-500 cursor-not-allowed"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="size-3" strokeWidth={3} />
                    ) : (
                      <span className="text-xs">{index + 1}</span>
                    )}
                  </button>
                  <span
                    className={cn(
                      "text-xs text-center max-w-[120px] transition-colors duration-300 whitespace-nowrap",
                      isActive && "font-semibold text-black",
                      isCompleted && "text-gray-700",
                      !isCompleted && !isActive && "text-gray-400"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile version */}
      <div className="md:hidden">
        <div className="relative">
          {/* Barre de fond continue pour mobile */}
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200" />

          {/* Barre de progression verte pour mobile */}
          <div
            className="absolute top-4 left-4 h-0.5 bg-green transition-all duration-500"
            style={{
              width: `calc(${(activeStep / (steps.length - 1)) * 100}% - ${
                (activeStep / (steps.length - 1)) * 2
              }rem)`,
            }}
          />

          <div className="flex items-center justify-between relative">
            {steps.map((step, index) => {
              const isActive = index === activeStep;
              const isCompleted = index < activeStep;
              const isClickable = index <= activeStep && onStepClick;

              return (
                <button
                  key={step.id}
                  onClick={() => isClickable && onStepClick(index)}
                  disabled={!isClickable}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 shrink-0 relative z-10",
                    isCompleted &&
                      "bg-green text-black cursor-pointer hover:scale-110",
                    isActive &&
                      "bg-green text-black border-2 border-green/30 scale-110 cursor-pointer hover:scale-[1.15]",
                    !isCompleted &&
                      !isActive &&
                      "bg-gray-200 text-gray-500 cursor-not-allowed"
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-4" strokeWidth={3} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-3 text-center">
          <p className="text-sm font-semibold text-black">
            {steps[activeStep].label}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Étape {activeStep + 1} sur {steps.length}
          </p>
        </div>
      </div>
    </Card>
  );
};
