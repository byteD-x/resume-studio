"use client";

import { ChevronDown, ChevronUp, Copy, Files, GripVertical, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ResumeAssistPanel } from "@/components/product/editor/ResumeAssistPanel";
import { RichTextField } from "@/components/product/editor/RichTextField";
import { readClientAiConfig } from "@/lib/client-ai-config";
import { handleSanitizedPaste } from "@/lib/editor-input";
import { htmlFieldToText, type EditorSectionDefinition } from "@/lib/resume-editor";
import { buildItemAssistPack } from "@/lib/resume-assistant";
import type { ResumeAssistSuggestion } from "@/lib/resume-assistant";
import type { ResumeDocument, ResumeSectionItem, ResumeWriterProfile } from "@/types/resume";

export function ResumeSectionItemCard({
  document,
  item,
  itemIndex,
  onChange,
  onCopy,
  onDelete,
  onDuplicate,
  onMove,
  registerTitleInput,
  sectionType,
  total,
  writerProfile,
}: {
  document: ResumeDocument;
  item: ResumeSectionItem;
  itemIndex: number;
  onChange: (nextItem: ResumeSectionItem) => void;
  onCopy: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (direction: "up" | "down") => void;
  registerTitleInput: (element: HTMLInputElement | null) => void;
  sectionType: EditorSectionDefinition["type"];
  total: number;
  writerProfile: ResumeWriterProfile;
}) {
  const assistPack = useMemo(
    () => buildItemAssistPack(sectionType, item, writerProfile),
    [item, sectionType, writerProfile],
  );
  const [remoteSuggestions, setRemoteSuggestions] = useState<ResumeAssistSuggestion[]>([]);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const usesRemoteProvider = document.ai.provider === "openai-compatible";
  const isSkillsSection = sectionType === "skills";
  const targetingKeywordsKey = document.targeting.focusKeywords.join("|");
  const itemBulletsKey = item.bulletPoints.join("|");
  const itemTagsKey = item.tags.join("|");
  const combinedSuggestions =
    remoteSuggestions.length > 0 ? [...remoteSuggestions, ...assistPack.suggestions] : assistPack.suggestions;

  useEffect(() => {
    setRemoteSuggestions([]);
    setRemoteError(null);
  }, [
    document.ai.provider,
    document.ai.model,
    document.ai.baseUrl,
    document.targeting.role,
    document.targeting.jobDescription,
    targetingKeywordsKey,
    item.id,
    item.title,
    item.subtitle,
    item.meta,
    item.summaryHtml,
    itemBulletsKey,
    itemTagsKey,
  ]);

  async function handleGenerateRemoteAssist() {
    setRemoteLoading(true);
    setRemoteError(null);

    try {
      const response = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "section",
          document,
          sectionType,
          item,
          apiKey: readClientAiConfig().apiKey,
        }),
      });

      if (!response.ok) {
        throw new Error((await response.text()) || "Failed to generate suggestions");
      }

      const result = (await response.json()) as { suggestions?: ResumeAssistSuggestion[] };
      setRemoteSuggestions(Array.isArray(result.suggestions) ? result.suggestions : []);
    } catch (error) {
      setRemoteError(error instanceof Error ? error.message : "Failed to generate suggestions");
    } finally {
      setRemoteLoading(false);
    }
  }

  const updateBullet = (bulletIndex: number, value: string) => {
    onChange({
      ...item,
      bulletPoints: item.bulletPoints.map((bullet, index) => (index === bulletIndex ? value : bullet)).filter(Boolean),
    });
  };

  const appendBullet = () => {
    onChange({
      ...item,
      bulletPoints: [...item.bulletPoints, ""],
    });
  };

  const removeBullet = (bulletIndex: number) => {
    onChange({
      ...item,
      bulletPoints: item.bulletPoints.filter((_, index) => index !== bulletIndex),
    });
  };

  const moveBullet = (bulletIndex: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? bulletIndex - 1 : bulletIndex + 1;
    if (targetIndex < 0 || targetIndex >= item.bulletPoints.length) {
      return;
    }

    const next = [...item.bulletPoints];
    const [current] = next.splice(bulletIndex, 1);
    next.splice(targetIndex, 0, current);
    onChange({
      ...item,
      bulletPoints: next,
    });
  };

  return (
    <article className="editor-item-detail-card">
      <div className="editor-item-detail-head">
        <div>
          <div className="editor-item-detail-kicker">
            <GripVertical className="size-4" />
            <span>
              #{itemIndex + 1} / {total}
            </span>
          </div>
        </div>

        <div className="editor-item-actions">
          <button aria-label="复制内容" className="icon-button" onClick={onCopy} title="复制内容" type="button">
            <Copy className="size-4" />
          </button>
          <button aria-label="复制条目" className="icon-button" onClick={onDuplicate} title="复制条目" type="button">
            <Files className="size-4" />
          </button>
          <button
            aria-label="上移条目"
            className="icon-button"
            disabled={itemIndex === 0}
            onClick={() => onMove("up")}
            title="上移"
            type="button"
          >
            <ChevronUp className="size-4" />
          </button>
          <button
            aria-label="下移条目"
            className="icon-button"
            disabled={itemIndex === total - 1}
            onClick={() => onMove("down")}
            title="下移"
            type="button"
          >
            <ChevronDown className="size-4" />
          </button>
          <button aria-label="删除条目" className="icon-button" onClick={onDelete} title="删除条目" type="button">
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {isSkillsSection ? (
        <div className="editor-field-grid editor-item-primary-fields editor-item-skill-grid">
          <label className="field-shell">
            <span className="field-label">技能组</span>
            <input
              className="input-control"
              onChange={(event) => onChange({ ...item, title: event.target.value })}
              onPaste={(event) =>
                handleSanitizedPaste(event, {
                  currentValue: item.title,
                  mode: "single-line",
                  onValueChange: (nextValue) => onChange({ ...item, title: nextValue }),
                })
              }
              placeholder="前端工程 / AI 应用 / 数据分析"
              ref={registerTitleInput}
              value={item.title}
            />
          </label>
          <label className="field-shell">
            <span className="field-label">重点方向</span>
            <input
              className="input-control"
              onChange={(event) => onChange({ ...item, subtitle: event.target.value })}
              onPaste={(event) =>
                handleSanitizedPaste(event, {
                  currentValue: item.subtitle,
                  mode: "single-line",
                  onValueChange: (nextValue) => onChange({ ...item, subtitle: nextValue }),
                })
              }
              placeholder="工程化 / 平台建设 / 交付场景"
              value={item.subtitle}
            />
          </label>
          <label className="field-shell">
            <span className="field-label">熟练度 / 使用场景</span>
            <input
              className="input-control"
              onChange={(event) => onChange({ ...item, meta: event.target.value })}
              onPaste={(event) =>
                handleSanitizedPaste(event, {
                  currentValue: item.meta,
                  mode: "single-line",
                  onValueChange: (nextValue) => onChange({ ...item, meta: nextValue }),
                })
              }
              placeholder="熟练使用 / 核心栈 / 常用在项目交付"
              value={item.meta}
            />
          </label>
        </div>
      ) : (
        <>
          <div className="editor-field-grid editor-item-primary-fields">
            <label className="field-shell">
              <span className="field-label">{sectionType === "education" ? "学校 / 机构" : "标题"}</span>
              <input
                className="input-control"
                onChange={(event) => onChange({ ...item, title: event.target.value })}
                onPaste={(event) =>
                  handleSanitizedPaste(event, {
                    currentValue: item.title,
                    mode: "single-line",
                    onValueChange: (nextValue) => onChange({ ...item, title: nextValue }),
                  })
                }
                ref={registerTitleInput}
                value={item.title}
              />
            </label>
            <label className="field-shell">
              <span className="field-label">{sectionType === "education" ? "专业 / 学位" : "副标题 / 角色"}</span>
              <input
                className="input-control"
                onChange={(event) => onChange({ ...item, subtitle: event.target.value })}
                onPaste={(event) =>
                  handleSanitizedPaste(event, {
                    currentValue: item.subtitle,
                    mode: "single-line",
                    onValueChange: (nextValue) => onChange({ ...item, subtitle: nextValue }),
                  })
                }
                value={item.subtitle}
              />
            </label>
            <label className="field-shell">
              <span className="field-label">时间</span>
              <input
                className="input-control"
                onChange={(event) => onChange({ ...item, dateRange: event.target.value })}
                onPaste={(event) =>
                  handleSanitizedPaste(event, {
                    currentValue: item.dateRange,
                    mode: "single-line",
                    onValueChange: (nextValue) => onChange({ ...item, dateRange: nextValue }),
                  })
                }
                placeholder="2023.06 - 2024.02"
                value={item.dateRange}
              />
            </label>
            <label className="field-shell">
              <span className="field-label">地点 / 远程</span>
              <input
                className="input-control"
                onChange={(event) => onChange({ ...item, location: event.target.value })}
                onPaste={(event) =>
                  handleSanitizedPaste(event, {
                    currentValue: item.location,
                    mode: "single-line",
                    onValueChange: (nextValue) => onChange({ ...item, location: nextValue }),
                  })
                }
                value={item.location}
              />
            </label>
          </div>

          <div className="editor-item-secondary-fields">
            <label className="field-shell">
              <span className="field-label">补充信息</span>
              <input
                className="input-control"
                onChange={(event) => onChange({ ...item, meta: event.target.value })}
                onPaste={(event) =>
                  handleSanitizedPaste(event, {
                    currentValue: item.meta,
                    mode: "single-line",
                    onValueChange: (nextValue) => onChange({ ...item, meta: nextValue }),
                  })
                }
                placeholder="团队 / 技术栈"
                value={item.meta}
              />
            </label>
          </div>
        </>
      )}

      <RichTextField
        ariaLabel="条目摘要"
        helper=""
        label={isSkillsSection ? "补充说明" : "摘要"}
        minHeight={isSkillsSection ? 108 : 124}
        onChange={(nextValue) =>
          onChange({
            ...item,
            summaryHtml: nextValue,
          })
        }
        placeholder={isSkillsSection ? "说明这组技能主要服务的方向、项目或交付场景" : "背景 / 职责 / 方法"}
        value={item.summaryHtml}
      />

      {isSkillsSection ? (
        <div className="editor-item-block">
          <label className="field-shell">
            <span className="field-label">技能关键词</span>
            <textarea
              className="textarea-control min-h-24"
              onChange={(event) =>
                onChange({
                  ...item,
                  tags: event.target.value
                    .split(/[，\n、/]/)
                    .map((value) => value.trim())
                    .filter(Boolean),
                })
              }
              onPaste={(event) =>
                handleSanitizedPaste(event, {
                  currentValue: item.tags.join(", "),
                  mode: "skills",
                  onValueChange: (nextValue) =>
                    onChange({
                      ...item,
                      tags: nextValue
                        .split(/[，]/)
                        .map((value) => value.trim())
                        .filter(Boolean),
                    }),
                })
              }
              placeholder="React, TypeScript, Node.js, LLM, Prompt Engineering"
              value={item.tags.join(", ")}
            />
          </label>
          <p className="editor-item-inline-note">按“技能组 + 关键词”录入，预览会按同一组聚合展示。</p>
        </div>
      ) : (
        <div className="editor-item-block">
          <div className="editor-item-block-head">
            <div>
              <span className="field-label">要点</span>
            </div>
            <button className="btn btn-secondary" onClick={appendBullet} type="button">
              <Plus className="size-4" />
              新增要点
            </button>
          </div>

          <div className="editor-bullet-list">
            {item.bulletPoints.length > 0 ? (
              item.bulletPoints.map((bullet, bulletIndex) => (
                <div className="editor-bullet-row" key={`${item.id}-bullet-${bulletIndex}`}>
                  <span className="editor-bullet-index">{bulletIndex + 1}</span>
                  <textarea
                    className="textarea-control editor-bullet-input"
                    onChange={(event) => updateBullet(bulletIndex, event.target.value)}
                    placeholder="职责、动作、结果"
                    value={bullet}
                  />
                  <div className="editor-bullet-actions">
                    <button
                      aria-label="上移要点"
                      className="icon-button"
                      disabled={bulletIndex === 0}
                      onClick={() => moveBullet(bulletIndex, "up")}
                      type="button"
                    >
                      <ChevronUp className="size-4" />
                    </button>
                    <button
                      aria-label="下移要点"
                      className="icon-button"
                      disabled={bulletIndex === item.bulletPoints.length - 1}
                      onClick={() => moveBullet(bulletIndex, "down")}
                      type="button"
                    >
                      <ChevronDown className="size-4" />
                    </button>
                    <button
                      aria-label="删除要点"
                      className="icon-button"
                      onClick={() => removeBullet(bulletIndex)}
                      type="button"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="editor-bullet-empty">暂无要点</div>
            )}
          </div>
        </div>
      )}

      <ResumeAssistPanel
        description=""
        getCurrentValue={(suggestion) => {
          if (suggestion.target === "summary") {
            return htmlFieldToText(item.summaryHtml);
          }

          if (suggestion.target === "bullets") {
            return item.bulletPoints;
          }

          if (suggestion.target === "tags") {
            return item.tags;
          }

          return null;
        }}
        issues={assistPack.issues}
        onApply={(suggestion) => {
          if (suggestion.target === "summary" && typeof suggestion.nextValue === "string") {
            onChange({
              ...item,
              summaryHtml: suggestion.nextValue,
            });
          }

          if (suggestion.target === "bullets" && Array.isArray(suggestion.nextValue)) {
            onChange({
              ...item,
              bulletPoints: suggestion.nextValue,
            });
          }

          if (suggestion.target === "tags" && Array.isArray(suggestion.nextValue)) {
            onChange({
              ...item,
              tags: suggestion.nextValue,
            });
          }
        }}
        onGenerateRemote={() => void handleGenerateRemoteAssist()}
        remoteDisabled={!usesRemoteProvider || remoteLoading}
        remoteError={remoteError}
        remoteHint={usesRemoteProvider ? "基于当前条目生成" : "先配置 AI"}
        remoteLabel="生成"
        remoteLoading={remoteLoading}
        suggestions={combinedSuggestions}
        title={isSkillsSection ? "技能优化" : "条目优化"}
      />
    </article>
  );
}
