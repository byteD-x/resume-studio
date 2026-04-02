// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { AiConfigForm } from "@/components/ai/AiConfigForm";
import { enhancedResumeAiPresets } from "@/lib/resume-ai";

function AiConfigHarness() {
  const initialPreset = enhancedResumeAiPresets.find((preset) => preset.id === "groq-qwen3-32b") ?? enhancedResumeAiPresets[0];
  const [provider, setProvider] = useState<"local" | "openai-compatible">(initialPreset.settings.provider);
  const [model, setModel] = useState(initialPreset.settings.model);
  const [baseUrl, setBaseUrl] = useState(initialPreset.settings.baseUrl);
  const [apiKey, setApiKey] = useState("");

  return (
    <AiConfigForm
      apiKey={apiKey}
      baseUrl={baseUrl}
      description=""
      model={model}
      onApiKeyChange={setApiKey}
      onApplyPreset={(presetId) => {
        const preset = enhancedResumeAiPresets.find((item) => item.id === presetId);
        if (!preset) return;
        setProvider(preset.settings.provider);
        setModel(preset.settings.model);
        setBaseUrl(preset.settings.baseUrl);
      }}
      onBaseUrlChange={setBaseUrl}
      onModelChange={setModel}
      onProviderChange={setProvider}
      provider={provider}
      title="网站导入模型"
    />
  );
}

describe("ai config form", () => {
  it("syncs model and support links when switching presets", () => {
    render(<AiConfigHarness />);

    fireEvent.click(screen.getByRole("button", { name: /OpenRouter Free/i }));

    expect(screen.getByText("openrouter/free")).toBeTruthy();

    const apiKeyLink = screen.getByRole("link", { name: /获取 Key/i });
    const docsLink = screen.getByRole("link", { name: /文档/i });

    expect(apiKeyLink.getAttribute("href")).toBe("https://openrouter.ai/settings/keys");
    expect(docsLink.getAttribute("href")).toBe("https://openrouter.ai/docs/guides/routing/routers/free-models-router");

    fireEvent.click(screen.getByText("高级设置"));

    expect(screen.getByDisplayValue("openrouter/free")).toBeTruthy();
    expect(screen.getByDisplayValue("https://openrouter.ai/api/v1")).toBeTruthy();
  });
});
