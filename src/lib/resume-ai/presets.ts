import type { ResumeAiSettings } from "@/types/resume";
import {
  DEFAULT_FALLBACK_FREE_CLOUD_BASE_URL,
  DEFAULT_FALLBACK_FREE_CLOUD_MODEL,
  DEFAULT_FREE_BASE_URL,
  DEFAULT_FREE_CLOUD_BASE_URL,
  DEFAULT_FREE_CLOUD_MODEL,
} from "@/lib/resume-ai/constants";
import type { ResumeAiPresetOption } from "@/lib/resume-ai/types";

export const freeResumeAiPresets = [
  {
    id: "qwen3-4b",
    label: "Qwen3 4B",
    description: "免费、本地、响应更快，适合网站导入和日常编辑建议。",
    settings: {
      provider: "openai-compatible",
      model: "qwen3:4b",
      baseUrl: DEFAULT_FREE_BASE_URL,
    } satisfies ResumeAiSettings,
  },
  {
    id: "qwen3-8b",
    label: "Qwen3 8B",
    description: "免费、本地、效果更稳，适合摘要和经历润色。",
    settings: {
      provider: "openai-compatible",
      model: "qwen3:8b",
      baseUrl: DEFAULT_FREE_BASE_URL,
    } satisfies ResumeAiSettings,
  },
] as const;

export const preferredResumeAiPresets = [
  {
    apiKeyUrl: "https://console.groq.com/keys",
    docsUrl: "https://console.groq.com/docs/openai",
    id: "groq-qwen3-32b",
    kind: "cloud-free",
    label: "Groq Qwen3 32B",
    description: "Cloud free default via Groq's OpenAI-compatible API.",
    providerName: "Groq",
    settings: {
      provider: "openai-compatible",
      model: DEFAULT_FREE_CLOUD_MODEL,
      baseUrl: DEFAULT_FREE_CLOUD_BASE_URL,
    } satisfies ResumeAiSettings,
  },
  {
    apiKeyUrl: "https://openrouter.ai/settings/keys",
    docsUrl: "https://openrouter.ai/openrouter/free/api",
    id: "openrouter-free",
    kind: "cloud-free",
    label: "OpenRouter Free",
    description: "Cloud free router that selects from OpenRouter's currently free models.",
    providerName: "OpenRouter",
    settings: {
      provider: "openai-compatible",
      model: DEFAULT_FALLBACK_FREE_CLOUD_MODEL,
      baseUrl: DEFAULT_FALLBACK_FREE_CLOUD_BASE_URL,
    } satisfies ResumeAiSettings,
  },
  {
    docsUrl: "https://ollama.com/download",
    id: "ollama-qwen3-4b",
    kind: "local-free",
    label: "Ollama Qwen3 4B",
    description: "Local free fallback for self-hosted development.",
    providerName: "Ollama",
    settings: {
      provider: "openai-compatible",
      model: "qwen3:4b",
      baseUrl: DEFAULT_FREE_BASE_URL,
    } satisfies ResumeAiSettings,
  },
] as const;

export const enhancedResumeAiPresets: readonly ResumeAiPresetOption[] = [
  {
    apiKeyUrl: "https://console.groq.com/keys",
    description: "永久免费额度，速度快，适合先把网站内容抽成结构化草稿。",
    docsUrl: "https://console.groq.com/docs/openai",
    freeLabel: "永久免费",
    id: "groq-qwen3-32b",
    kind: "cloud-free",
    label: "Groq Qwen3 32B",
    providerName: "Groq",
    settings: {
      provider: "openai-compatible",
      model: DEFAULT_FREE_CLOUD_MODEL,
      baseUrl: DEFAULT_FREE_CLOUD_BASE_URL,
    },
  },
  {
    apiKeyUrl: "https://openrouter.ai/settings/keys",
    description: "免费路由器，会自动在当前可用的免费模型之间切换。",
    docsUrl: "https://openrouter.ai/docs/guides/routing/routers/free-models-router",
    freeLabel: "免费路由",
    id: "openrouter-free",
    kind: "cloud-free",
    label: "OpenRouter Free",
    providerName: "OpenRouter",
    settings: {
      provider: "openai-compatible",
      model: DEFAULT_FALLBACK_FREE_CLOUD_MODEL,
      baseUrl: DEFAULT_FALLBACK_FREE_CLOUD_BASE_URL,
    },
  },
  {
    apiKeyUrl: "https://cloud.siliconflow.cn/account/ak",
    description: "免费模型可直接用，适合想固定到 Qwen 8B 的云端方案。",
    docsUrl: "https://docs.siliconflow.cn/en/api-reference/chat-completions/chat-completions",
    freeLabel: "免费模型",
    id: "siliconflow-qwen3-8b",
    kind: "cloud-free",
    label: "SiliconFlow Qwen3 8B",
    providerName: "SiliconFlow",
    settings: {
      provider: "openai-compatible",
      model: "Qwen/Qwen3-8B",
      baseUrl: "https://api.siliconflow.cn/v1",
    },
  },
  {
    apiKeyUrl: "https://cloud.cerebras.ai",
    description: "永久免费，模型更大，适合对抽取稳定性要求更高的场景。",
    docsUrl: "https://inference-docs.cerebras.ai/resources/openai",
    freeLabel: "永久免费",
    id: "cerebras-gpt-oss-120b",
    kind: "cloud-free",
    label: "Cerebras GPT-OSS 120B",
    providerName: "Cerebras",
    settings: {
      provider: "openai-compatible",
      model: "gpt-oss-120b",
      baseUrl: "https://api.cerebras.ai/v1",
    },
  },
  {
    apiKeyUrl: "https://cloud.sambanova.ai",
    description: "新账号常见有赠送额度，适合短期试用更大的推理模型。",
    docsUrl: "https://docs.sambanova.ai/docs/en/get-started/quickstart",
    freeLabel: "赠送额度",
    id: "sambanova-llama-3-3-70b",
    kind: "cloud-credit",
    label: "SambaNova Llama 3.3 70B",
    providerName: "SambaNova",
    settings: {
      provider: "openai-compatible",
      model: "Meta-Llama-3.3-70B-Instruct",
      baseUrl: "https://api.sambanova.ai/v1",
    },
  },
  {
    apiKeyUrl: "https://www.alibabacloud.com/help/en/model-studio/get-api-key",
    description: "适合希望直接使用阿里云兼容接口的方案，通常依赖新手额度。",
    docsUrl: "https://www.alibabacloud.com/help/en/model-studio/first-api-call-to-qwen",
    freeLabel: "新人额度",
    id: "alibaba-qwq-plus",
    kind: "cloud-credit",
    label: "Model Studio QwQ Plus",
    providerName: "Alibaba Cloud",
    settings: {
      provider: "openai-compatible",
      model: "qwq-plus",
      baseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    },
  },
  {
    description: "本地运行，不需要云端 Key，适合已经装好 Ollama 的环境。",
    docsUrl: "https://ollama.com/download",
    freeLabel: "本地免费",
    id: "ollama-qwen3-4b",
    kind: "local-free",
    label: "Ollama Qwen3 4B",
    providerName: "Ollama",
    settings: {
      provider: "openai-compatible",
      model: "qwen3:4b",
      baseUrl: DEFAULT_FREE_BASE_URL,
    },
  },
];
