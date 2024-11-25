"use client";

import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "chartjs-plugin-dragdata";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DraggableChartProps {
  label: string;
  values: number[];
  max: number;
  unit: string;
  onValuesChange: (newValues: number[]) => void;
  scaleMin: number;
  scaleMax: number;
}

export function DraggableChart({
  label,
  values,
  max,
  unit,
  onValuesChange,
  scaleMin,
  scaleMax,
}: DraggableChartProps) {
  const timeLabels = ["6m", "12m", "18m", "24m"];

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    layout: {
      padding: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: label,
        padding: {
          top: 0,
          bottom: 8,
        },
      },
      dragData: {
        round: 1,
        dragX: false,
        onDragStart: function () {
          // Optional callback
        },
        onDrag: function () {
          // Optional callback
        },
        onDragEnd: function (
          e: any,
          datasetIndex: number,
          index: number,
          value: number
        ) {
          // Ensure value stays within scale bounds
          const newValue = Math.min(Math.max(value, scaleMin), scaleMax);
          const newValues = [...values];
          newValues[index] = newValue;
          onValuesChange(newValues);
        },
      },
    },
    scales: {
      y: {
        min: scaleMin,
        max: scaleMax,
        title: {
          display: true,
          text: unit,
          padding: {
            top: 0,
            bottom: 0,
          },
        },
        ticks: {
          padding: 4,
        },
      },
      x: {
        ticks: {
          padding: 4,
        },
      },
    },
  };

  const data = {
    labels: timeLabels,
    datasets: [
      {
        label: label,
        data: values,
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        tension: 0.1,
        pointBackgroundColor: "rgb(75, 192, 192)",
        pointBorderColor: "white",
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  return (
    <div className="w-full h-[200px]">
      <Line options={options} data={data} />
    </div>
  );
}
