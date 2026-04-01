import { createId } from "@/lib/utils";
import { defaultPortfolioPayload } from "./constants";
import { type PortfolioData, type PortfolioExperience } from "./types";

export function parseTextPortfolio(content = defaultPortfolioPayload): PortfolioData {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const emailMatch = content.match(/[\w-.]+@([\w-]+\.)+[\w-]{2,4}/);
  const phoneMatch = content.match(/1[3-9]\d{9}/);
  const urlMatches = content.match(/https?:\/\/[^\s]+/g) || [];

  const github = urlMatches.find((url) => url.includes("github.com")) || "";
  const otherLinks = urlMatches
    .filter((url) => !url.includes("github.com"))
    .map((url) => ({ label: "Website", url }));

  let name = "鏈懡鍚?";
  let title = "姹傝亴鑰?";
  let subtitle = "";

  if (lines.length > 0) name = lines[0].slice(0, 30).replace(/#+\s*/g, "");
  if (lines.length > 1) title = lines[1].slice(0, 50).replace(/#+\s*/g, "");
  if (lines.length > 2) subtitle = lines.slice(2, 5).join(" ").slice(0, 200);

  const timeline: PortfolioExperience[] = [];
  const projects: PortfolioExperience[] = [];
  const contentBlocks: string[][] = [];
  let currentBlock: string[] = [];

  for (const line of lines.slice(2)) {
    if (line.match(/^(椤圭洰|缁忓巻|宸ヤ綔|Project|Experience|Root Page|Linked Page|#)/i)) {
      if (currentBlock.length > 0) {
        contentBlocks.push(currentBlock);
        currentBlock = [];
      }
    }
    currentBlock.push(line);
  }

  if (currentBlock.length > 0) {
    contentBlocks.push(currentBlock);
  }

  contentBlocks.forEach((block) => {
    if (block.length < 2) return;

    const header = block[0].replace(/#+\s*/g, "");
    const isProject = /椤圭洰|project/i.test(header);
    const roleOrName = header;
    const summary = block.slice(1).join("\n");

    const item: PortfolioExperience = {
      id: createId("exp"),
      year: "鏈煡鏃堕棿",
      name: isProject ? roleOrName : undefined,
      company: !isProject ? roleOrName : undefined,
      role: isProject ? "" : "鐩稿叧瑙掕壊",
      summary,
      techTags: [],
    };

    if (isProject) {
      projects.push(item);
    } else {
      timeline.push(item);
    }
  });

  if (projects.length === 0 && timeline.length === 0 && lines.length > 5) {
    projects.push({
      id: createId("exp"),
      year: "杩戞湡",
      name: "瀵煎叆椤圭洰",
      summary: lines.slice(5, 15).join("\n"),
      techTags: [],
    });
  }

  return {
    hero: { name, title, subtitle, location: "" },
    about: { zh: subtitle },
    timeline,
    projects,
    skills: [],
    contact: {
      email: emailMatch ? emailMatch[0] : "",
      phone: phoneMatch ? phoneMatch[0] : "",
      github,
      websiteLinks: otherLinks,
    },
  };
}
