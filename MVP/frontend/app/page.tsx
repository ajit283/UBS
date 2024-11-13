"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, Loader2, BarChart3 } from "lucide-react";
import { useChat, experimental_useObject as useObject } from "ai/react";
import { eventSchema } from "./api/chat/route";
import { z } from "zod";

type Parameters = {
  pdf_ratio: number;
  pdf_value: number;
  weighted_mean_unemployment_rate_6m: number;
  weighted_mean_unemployment_rate_12m: number;
  weighted_mean_unemployment_rate_18m: number;
  weighted_mean_unemployment_rate_24m: number;
  weighted_mean_gdp_6m: number;
  weighted_mean_gdp_12m: number;
  weighted_mean_gdp_18m: number;
  weighted_mean_gdp_24m: number;
  weighted_mean_oil_price_6m: number;
  weighted_mean_oil_price_12m: number;
  weighted_mean_oil_price_18m: number;
  weighted_mean_oil_price_24m: number;
  weighted_mean_cpi_6m: number;
  weighted_mean_cpi_12m: number;
  weighted_mean_cpi_18m: number;
  weighted_mean_cpi_24m: number;
};

const BACKEND_URL = "http://localhost:5000/";

export default function Component() {
  async function getParameters(scenario: number, query: string) {
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
  }
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

  async function recalculatePDF(parameters: Parameters, scenario: number) {
    const response = await fetch(BACKEND_URL + "calculate_pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        slider_values: Object.values(
          Object.entries(parameters)
            .filter(([key]) => key !== "pdf_value" && key !== "pdf_ratio")
            .map(([key, value]) => value)
        ),
      }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    setParameterMap((prevMap) =>
      new Map(prevMap).set(scenario, { ...parameters, ...data })
    );
  }

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

  if (!parameterMap.has(selectedScenario) && selectedScenario >= 0) {
    getParameters(
      selectedScenario,
      object?.scenarios!![selectedScenario]!!.description!!
    );
  }

  const handleGenerate = async () => {
    setIsGenerating(true);
    await submit(instructions);

    setSelectedScenario(-1);
    setIsGenerating(false);
  };

  const parameterSliders = (parameters: Parameters, scenarioIdx: number) => {
    const handleSliderChange = (key: keyof Parameters, newValue: number) => {
      setParameterMap((prevMap) => {
        const updatedParameters = {
          ...prevMap.get(scenarioIdx),
          [key]: newValue,
        } as Parameters;

        // Recalculate the PDF and update the map with new PDF values
        recalculatePDF(updatedParameters, scenarioIdx);

        return new Map(prevMap).set(scenarioIdx, updatedParameters);
      });
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        {/* Unemployment Group */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-semibold mb-3">Unemployment Rate</h3>
          <div className="space-y-3">
            <ParameterSlider
              label="6 months"
              value={parameters.weighted_mean_unemployment_rate_6m}
              max={100}
              unit="%"
              onChange={(val) =>
                handleSliderChange("weighted_mean_unemployment_rate_6m", val)
              }
            />
            <ParameterSlider
              label="12 months"
              value={parameters.weighted_mean_unemployment_rate_12m}
              max={100}
              unit="%"
              onChange={(val) =>
                handleSliderChange("weighted_mean_unemployment_rate_12m", val)
              }
            />
            <ParameterSlider
              label="18 months"
              value={parameters.weighted_mean_unemployment_rate_18m}
              max={100}
              unit="%"
              onChange={(val) =>
                handleSliderChange("weighted_mean_unemployment_rate_18m", val)
              }
            />
            <ParameterSlider
              label="24 months"
              value={parameters.weighted_mean_unemployment_rate_24m}
              max={100}
              unit="%"
              onChange={(val) =>
                handleSliderChange("weighted_mean_unemployment_rate_24m", val)
              }
            />
          </div>
        </div>

        {/* GDP Group */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-semibold mb-3">GDP</h3>
          <div className="space-y-3">
            <ParameterSlider
              label="6 months"
              value={parameters.weighted_mean_gdp_6m}
              max={100}
              unit="%"
              onChange={(val) =>
                handleSliderChange("weighted_mean_gdp_6m", val)
              }
            />
            <ParameterSlider
              label="12 months"
              value={parameters.weighted_mean_gdp_12m}
              max={100}
              unit="%"
              onChange={(val) =>
                handleSliderChange("weighted_mean_gdp_12m", val)
              }
            />
            <ParameterSlider
              label="18 months"
              value={parameters.weighted_mean_gdp_18m}
              max={100}
              unit="%"
              onChange={(val) =>
                handleSliderChange("weighted_mean_gdp_18m", val)
              }
            />
            <ParameterSlider
              label="24 months"
              value={parameters.weighted_mean_gdp_24m}
              max={100}
              unit="%"
              onChange={(val) =>
                handleSliderChange("weighted_mean_gdp_24m", val)
              }
            />
          </div>
        </div>

        {/* Oil Price Group */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-semibold mb-3">Oil Price</h3>
          <div className="space-y-3">
            <ParameterSlider
              label="6 months"
              value={parameters.weighted_mean_oil_price_6m}
              max={200}
              unit="$"
              onChange={(val) =>
                handleSliderChange("weighted_mean_oil_price_6m", val)
              }
            />
            <ParameterSlider
              label="12 months"
              value={parameters.weighted_mean_oil_price_12m}
              max={200}
              unit="$"
              onChange={(val) =>
                handleSliderChange("weighted_mean_oil_price_12m", val)
              }
            />
            <ParameterSlider
              label="18 months"
              value={parameters.weighted_mean_oil_price_18m}
              max={200}
              unit="$"
              onChange={(val) =>
                handleSliderChange("weighted_mean_oil_price_18m", val)
              }
            />
            <ParameterSlider
              label="24 months"
              value={parameters.weighted_mean_oil_price_24m}
              max={200}
              unit="$"
              onChange={(val) =>
                handleSliderChange("weighted_mean_oil_price_24m", val)
              }
            />
          </div>
        </div>

        {/* CPI Group */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-semibold mb-3">CPI</h3>
          <div className="space-y-3">
            <ParameterSlider
              label="6 months"
              value={parameters.weighted_mean_cpi_6m}
              max={100}
              unit="%"
              onChange={(val) =>
                handleSliderChange("weighted_mean_cpi_6m", val)
              }
            />
            <ParameterSlider
              label="12 months"
              value={parameters.weighted_mean_cpi_12m}
              max={100}
              unit="%"
              onChange={(val) =>
                handleSliderChange("weighted_mean_cpi_12m", val)
              }
            />
            <ParameterSlider
              label="18 months"
              value={parameters.weighted_mean_cpi_18m}
              max={100}
              unit="%"
              onChange={(val) =>
                handleSliderChange("weighted_mean_cpi_18m", val)
              }
            />
            <ParameterSlider
              label="24 months"
              value={parameters.weighted_mean_cpi_24m}
              max={100}
              unit="%"
              onChange={(val) =>
                handleSliderChange("weighted_mean_cpi_24m", val)
              }
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <Card className="mb-6 bg-white shadow-md">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">
            Economic Scenario Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Additional instructions (optional)"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
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
                      onClick={() => setSelectedScenario(idx)}
                    >
                      <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          {scenario?.description}
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
                        <h3 className="text-lg font-semibold mb-3">
                          {parameterMap.get(selectedScenario)!.pdf_value}
                        </h3>

                        {parameterSliders(
                          parameterMap.get(selectedScenario)!,
                          selectedScenario
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

function ParameterSlider({
  label,
  value,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
  onChange: (newValue: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-medium text-gray-600 w-20">{label}</label>
      <Slider
        defaultValue={[value]}
        min={0}
        max={max}
        step={0.1}
        onValueCommit={(val) => onChange(val[0])}
        className="flex-grow"
      />
      <span className="text-xs font-medium text-gray-900 w-14 text-right">
        {value.toFixed(1)}
        {unit}
      </span>
    </div>
  );
}
