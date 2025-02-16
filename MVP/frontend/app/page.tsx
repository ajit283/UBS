"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, Loader2, BarChart3 } from "lucide-react";
import { useChat, experimental_useObject as useObject } from "ai/react";
import { eventSchema } from "./types";
import { z } from "zod";
import { LikelihoodIndicator } from "@/components/ui/likelihood-indicator";
import { DraggableChart } from "@/components/ui/draggable-chart";
import { Slider } from "@/components/ui/slider";
import Image from "next/image";

type Parameters = {
  pdf_ratio: number;
  pdf_value: number;
  weighted_mean_unemployment_rate_0m: number;
  weighted_mean_unemployment_rate_6m: number;
  weighted_mean_unemployment_rate_12m: number;
  weighted_mean_unemployment_rate_18m: number;
  weighted_mean_unemployment_rate_24m: number;
  weighted_mean_gdp_0m: number;
  weighted_mean_gdp_6m: number;
  weighted_mean_gdp_12m: number;
  weighted_mean_gdp_18m: number;
  weighted_mean_gdp_24m: number;
  weighted_mean_oil_price_0m: number;
  weighted_mean_oil_price_6m: number;
  weighted_mean_oil_price_12m: number;
  weighted_mean_oil_price_18m: number;
  weighted_mean_oil_price_24m: number;
  weighted_mean_cpi_0m: number;
  weighted_mean_cpi_6m: number;
  weighted_mean_cpi_12m: number;
  weighted_mean_cpi_18m: number;
  weighted_mean_cpi_24m: number;
  likelihood: string;
  events: Array<{
    name: string;
    content: string;
    date: string;
    relevance: number;
  }>;
};

type ChartScales = {
  unemployment: { min: number; max: number };
  gdp: { min: number; max: number };
  oilPrice: { min: number; max: number };
  cpi: { min: number; max: number };
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!!;

export default function Component() {
  async function getParameters(scenario: number, query: string) {
    console.log(BACKEND_URL);
    const response = await fetch(BACKEND_URL + "process_query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query,
      }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const rs: Parameters = await response.json();

    console.log(rs);

    setParameterMap((m) => new Map(m).set(scenario, rs));
    setChartScales(calculateChartScales(rs));
  }

  const [scaleFactor, setScaleFactor] = useState(1);

  const handleSliderChange = (
    scenario: number,
    key: keyof Parameters,
    newValue: number
  ) => {
    setParameterMap((prevMap) => {
      const updatedParameters = {
        ...prevMap.get(scenario),
        [key]: newValue,
      } as Parameters;

      // Recalculate the PDF and update the map with new PDF values
      recalculatePDF(updatedParameters, scenario);

      return new Map(prevMap).set(scenario, updatedParameters);
    });
  };

  const recalculatePDF = async (
    parameters: Parameters,
    scenarioIdx: number,
    scale: number = 1
  ) => {
    // Extract economic parameters and apply scaling
    const economic_params = {
      weighted_mean_unemployment_rate_6m:
        parameters.weighted_mean_unemployment_rate_6m * scale,
      weighted_mean_unemployment_rate_12m:
        parameters.weighted_mean_unemployment_rate_12m * scale,
      weighted_mean_unemployment_rate_18m:
        parameters.weighted_mean_unemployment_rate_18m * scale,
      weighted_mean_unemployment_rate_24m:
        parameters.weighted_mean_unemployment_rate_24m * scale,
      weighted_mean_gdp_6m: parameters.weighted_mean_gdp_6m * scale,
      weighted_mean_gdp_12m: parameters.weighted_mean_gdp_12m * scale,
      weighted_mean_gdp_18m: parameters.weighted_mean_gdp_18m * scale,
      weighted_mean_gdp_24m: parameters.weighted_mean_gdp_24m * scale,
      weighted_mean_oil_price_6m: parameters.weighted_mean_oil_price_6m * scale,
      weighted_mean_oil_price_12m:
        parameters.weighted_mean_oil_price_12m * scale,
      weighted_mean_oil_price_18m:
        parameters.weighted_mean_oil_price_18m * scale,
      weighted_mean_oil_price_24m:
        parameters.weighted_mean_oil_price_24m * scale,
      weighted_mean_cpi_6m: parameters.weighted_mean_cpi_6m * scale,
      weighted_mean_cpi_12m: parameters.weighted_mean_cpi_12m * scale,
      weighted_mean_cpi_18m: parameters.weighted_mean_cpi_18m * scale,
      weighted_mean_cpi_24m: parameters.weighted_mean_cpi_24m * scale,
    };

    const response = await fetch(BACKEND_URL + "calculate_pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        economic_params,
      }),
    });

    if (!response.ok) {
      console.error("Failed to calculate PDF");
      return;
    }

    const data = await response.json();
    setParameterMap((prevMap) =>
      new Map(prevMap).set(scenarioIdx, { ...parameters, ...data })
    );
  };

  const { object, submit } = useObject({
    api: "/api/chat",
    schema: eventSchema,
  });
  const [instructions, setInstructions] = useState("");
  const [parameterMap, setParameterMap] = useState<Map<number, Parameters>>(
    new Map()
  );
  const [selectedScenario, setSelectedScenario] = useState<number>(-1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [chartScales, setChartScales] = useState<ChartScales | null>(null);

  const calculateChartScales = (parameters: Parameters) => {
    const calculateScale = (values: number[]) => {
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min;
      const padding = range * 0.2;
      return {
        min: min - padding,
        max: max + padding,
      };
    };

    return {
      unemployment: calculateScale([
        parameters.weighted_mean_unemployment_rate_0m,
        parameters.weighted_mean_unemployment_rate_6m,
        parameters.weighted_mean_unemployment_rate_12m,
        parameters.weighted_mean_unemployment_rate_18m,
        parameters.weighted_mean_unemployment_rate_24m,
      ]),
      gdp: calculateScale([
        parameters.weighted_mean_gdp_0m,
        parameters.weighted_mean_gdp_6m,
        parameters.weighted_mean_gdp_12m,
        parameters.weighted_mean_gdp_18m,
        parameters.weighted_mean_gdp_24m,
      ]),
      oilPrice: calculateScale([
        parameters.weighted_mean_oil_price_0m,
        parameters.weighted_mean_oil_price_6m,
        parameters.weighted_mean_oil_price_12m,
        parameters.weighted_mean_oil_price_18m,
        parameters.weighted_mean_oil_price_24m,
      ]),
      cpi: calculateScale([
        parameters.weighted_mean_cpi_0m,
        parameters.weighted_mean_cpi_6m,
        parameters.weighted_mean_cpi_12m,
        parameters.weighted_mean_cpi_18m,
        parameters.weighted_mean_cpi_24m,
      ]),
    };
  };

  const handleScenarioSelect = (scenarioIdx: number) => {
    setSelectedScenario(scenarioIdx);
    const parameters = parameterMap.get(scenarioIdx);
    if (parameters) {
      setChartScales(calculateChartScales(parameters));
    }
  };

  useEffect(() => {
    if (!parameterMap.has(selectedScenario) && selectedScenario >= 0) {
      getParameters(
        selectedScenario,
        object?.scenarios!![selectedScenario]!!.description!!
      );
    } else if (selectedScenario >= 0) {
      // If we already have the parameters, just update the scales
      const parameters = parameterMap.get(selectedScenario);
      if (parameters) {
        setChartScales(calculateChartScales(parameters));
      }
    }
  }, [selectedScenario, object?.scenarios]);

  const handleGenerate = async () => {
    // Clear all states before starting a new query
    setParameterMap(new Map());
    setSelectedScenario(-1);
    setChartScales(null);

    setIsGenerating(true);
    await submit(instructions);
    setIsGenerating(false);
  };

  const parameterCharts = (parameters: Parameters, scenarioIdx: number) => {
    if (!chartScales) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Unemployment Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <ParameterChart
              label="Unemployment Rate"
              values={[
                parameters.weighted_mean_unemployment_rate_0m,
                parameters.weighted_mean_unemployment_rate_6m,
                parameters.weighted_mean_unemployment_rate_12m,
                parameters.weighted_mean_unemployment_rate_18m,
                parameters.weighted_mean_unemployment_rate_24m,
              ]}
              max={10}
              unit="%"
              scaleMin={chartScales.unemployment.min}
              scaleMax={chartScales.unemployment.max}
              onChange={(newValues) => {
                // Do not update the baseline (index 0)
                handleSliderChange(
                  scenarioIdx,
                  "weighted_mean_unemployment_rate_6m",
                  newValues[1]
                );
                handleSliderChange(
                  scenarioIdx,
                  "weighted_mean_unemployment_rate_12m",
                  newValues[2]
                );
                handleSliderChange(
                  scenarioIdx,
                  "weighted_mean_unemployment_rate_18m",
                  newValues[3]
                );
                handleSliderChange(
                  scenarioIdx,
                  "weighted_mean_unemployment_rate_24m",
                  newValues[4]
                );
              }}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>GDP</CardTitle>
          </CardHeader>
          <CardContent>
            <ParameterChart
              label="GDP"
              values={[
                parameters.weighted_mean_gdp_0m,
                parameters.weighted_mean_gdp_6m,
                parameters.weighted_mean_gdp_12m,
                parameters.weighted_mean_gdp_18m,
                parameters.weighted_mean_gdp_24m,
              ]}
              max={10}
              unit="Billion USD"
              scaleMin={chartScales.gdp.min}
              scaleMax={chartScales.gdp.max}
              onChange={(newValues) => {
                handleSliderChange(
                  scenarioIdx,
                  "weighted_mean_gdp_6m",
                  newValues[1]
                );
                handleSliderChange(
                  scenarioIdx,
                  "weighted_mean_gdp_12m",
                  newValues[2]
                );
                handleSliderChange(
                  scenarioIdx,
                  "weighted_mean_gdp_18m",
                  newValues[3]
                );
                handleSliderChange(
                  scenarioIdx,
                  "weighted_mean_gdp_24m",
                  newValues[4]
                );
              }}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Oil Price</CardTitle>
          </CardHeader>
          <CardContent>
            <ParameterChart
              label="Oil Price"
              values={[
                parameters.weighted_mean_oil_price_0m,
                parameters.weighted_mean_oil_price_6m,
                parameters.weighted_mean_oil_price_12m,
                parameters.weighted_mean_oil_price_18m,
                parameters.weighted_mean_oil_price_24m,
              ]}
              max={200}
              unit="USD/barrel"
              scaleMin={chartScales.oilPrice.min}
              scaleMax={chartScales.oilPrice.max}
              onChange={(newValues) => {
                handleSliderChange(
                  scenarioIdx,
                  "weighted_mean_oil_price_6m",
                  newValues[1]
                );
                handleSliderChange(
                  scenarioIdx,
                  "weighted_mean_oil_price_12m",
                  newValues[2]
                );
                handleSliderChange(
                  scenarioIdx,
                  "weighted_mean_oil_price_18m",
                  newValues[3]
                );
                handleSliderChange(
                  scenarioIdx,
                  "weighted_mean_oil_price_24m",
                  newValues[4]
                );
              }}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>CPI</CardTitle>
          </CardHeader>
          <CardContent>
            <ParameterChart
              label="CPI"
              values={[
                parameters.weighted_mean_cpi_0m,
                parameters.weighted_mean_cpi_6m,
                parameters.weighted_mean_cpi_12m,
                parameters.weighted_mean_cpi_18m,
                parameters.weighted_mean_cpi_24m,
              ]}
              max={10}
              unit=""
              scaleMin={chartScales.cpi.min}
              scaleMax={chartScales.cpi.max}
              onChange={(newValues) => {
                handleSliderChange(
                  scenarioIdx,
                  "weighted_mean_cpi_6m",
                  newValues[1]
                );
                handleSliderChange(
                  scenarioIdx,
                  "weighted_mean_cpi_12m",
                  newValues[2]
                );
                handleSliderChange(
                  scenarioIdx,
                  "weighted_mean_cpi_18m",
                  newValues[3]
                );
                handleSliderChange(
                  scenarioIdx,
                  "weighted_mean_cpi_24m",
                  newValues[4]
                );
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  };

  const ParameterChart = ({
    label,
    values,
    max,
    unit,
    scaleMin,
    scaleMax,
    onChange,
  }: {
    label: string;
    values: number[];
    max: number;
    unit: string;
    scaleMin: number;
    scaleMax: number;
    onChange: (values: number[]) => void;
  }) => {
    return (
      <div className="space-y-2">
        <DraggableChart
          label={label}
          values={values}
          max={max}
          unit={unit}
          scaleMin={scaleMin}
          scaleMax={scaleMax}
          onValuesChange={onChange}
        />
      </div>
    );
  };

  function EventList({ events }: { events: Parameters["events"] }) {
    if (!events || events.length === 0) {
      return null;
    }

    return (
      <Card className="w-full mt-4">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Related Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.map((event, index) => (
              <div key={index} className="p-4 border rounded-lg bg-muted">
                <div className="flex items-center justify-between ">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{event.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {event.date}
                    </p>
                    <p className="mt-2">{event.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <Card className="mb-6 bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-3xl font-bold text-primary">
            Economic Scenario Generator
          </CardTitle>
          <Image src="/image.png" alt="UBS Logo" width={300} height={100} />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Additional instructions (optional)"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isGenerating) {
                      handleGenerate();
                    }
                  }}
                  className="flex-grow"
                />
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  size="icon"
                  variant="outline"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TrendingUp className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-4 text-primary">
                  Generated Scenarios
                </h2>
                <div className="space-y-4">
                  {object?.scenarios?.map((scenario, idx) => (
                    <Card
                      key={idx}
                      className={`cursor-pointer transition-colors hover:bg-primary/5 ${
                        selectedScenario === idx
                          ? "border-primary bg-primary/10"
                          : ""
                      }`}
                      onClick={() => handleScenarioSelect(idx)}
                    >
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <BarChart3 className="h-4 w-4 mr-2" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold ">
                                {scenario?.event}
                              </div>
                              <div>{scenario?.description}</div>
                            </div>
                          </div>
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-2">
              {selectedScenario >= 0 ? (
                <div>
                  <h2 className="text-2xl font-bold mb-4 text-primary">
                    Economic Parameters
                  </h2>
                  <div className="space-y-6">
                    {parameterMap.has(selectedScenario) ? (
                      <div>
                        <div className="bg-gray-50 p-4 rounded-lg mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-600">
                                  PDF Value:
                                </span>
                                <span className="text-lg font-semibold text-primary">
                                  {parseFloat(
                                    //@ts-ignore
                                    parameterMap.get(selectedScenario)!
                                      .pdf_value
                                  ).toExponential(2)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-600">
                                  PDF Ratio:
                                </span>
                                <span className="text-lg font-semibold text-primary">
                                  {parseFloat(
                                    //@ts-ignore
                                    parameterMap.get(selectedScenario)!
                                      .pdf_ratio
                                  ).toExponential(2)}
                                </span>
                              </div>
                            </div>
                            <LikelihoodIndicator
                              likelihood={
                                parameterMap.get(selectedScenario)!.likelihood
                              }
                              className="ml-4"
                            />
                          </div>
                          <div className="flex flex-row py-2">
                            <div className="text-sm px-2 whitespace-nowrap">
                              less extreme
                            </div>
                            <Slider
                              onValueCommit={(v) => {
                                setScaleFactor(v[0]);

                                // Get current parameters for selected scenario
                                const currentParams =
                                  parameterMap.get(selectedScenario);
                                if (currentParams) {
                                  // Recalculate PDF with the new scale factor
                                  recalculatePDF(
                                    currentParams,
                                    selectedScenario,
                                    v[0]
                                  );
                                }
                              }}
                              defaultValue={[1]}
                              max={2}
                              step={0.1}
                            />
                            <div className="text-sm px-2 whitespace-nowrap">
                              more extreme
                            </div>
                          </div>
                        </div>
                        {parameterCharts(
                          parameterMap.get(selectedScenario)!,
                          selectedScenario
                        )}
                        {parameterMap.get(selectedScenario) && (
                          <EventList
                            events={
                              parameterMap.get(selectedScenario)?.events || []
                            }
                          />
                        )}
                      </div>
                    ) : (
                      <div>Loading...</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-lg text-gray-500">
                    Select a scenario to view its economic parameters
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
