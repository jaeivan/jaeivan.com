// PreToolUse hook: backs up the CLAUDE.md rules that are easy to break by accident.
// Blocks (exit 2, reason on stderr) when a Bash or GitHub call would:
//   - commit on, or push to, main (main is live on jaeivan.com; changes go through PRs)
//   - create or push a branch named claude/...
//   - put tool attribution (Co-Authored-By, Claude-Session, "Generated with ...") in a
//     commit, PR or comment
// Allows everything else (exit 0). Runs on Node with no dependencies.

import { execFileSync } from "node:child_process";

const ATTRIBUTION = [
  /co-authored-by:[^\n]*(claude|anthropic)/i,
  /claude-session:/i,
  /generated (with|by) \[?claude/i,
  /claude\.ai\/code/i,
  /noreply@anthropic\.com/i,
];
const MAIN = /^(\+?)(refs\/heads\/)?main$/;

function block(reason) {
  process.stderr.write(`Blocked by .claude/hooks/guard.mjs: ${reason}\n`);
  process.exit(2);
}

function currentBranch(cwd) {
  try {
    return execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function strings(value) {
  if (typeof value === "string") return [value];
  if (value && typeof value === "object") return Object.values(value).flatMap(strings);
  return [];
}

function checkAttribution(text) {
  if (ATTRIBUTION.some((re) => re.test(text))) {
    block("no tool attribution in commits, PRs or comments (see CLAUDE.md). Remove the trailer or footer.");
  }
}

function checkBash(command, cwd) {
  if (!/\bgit\b/.test(command)) return;
  checkAttribution(command);

  // Look at each git invocation on its own: `git add . && git commit ... && git push`.
  for (const segment of command.split(/&&|\|\||;|\n/)) {
    const words = segment.trim().split(/\s+/);
    const at = words.indexOf("git");
    if (at === -1) continue;
    const [sub, ...rest] = words.slice(at + 1).filter((w, i, all) => {
      // Skip global options such as `-C dir` before the subcommand.
      return !(w === "-C" || all[i - 1] === "-C");
    });
    const args = rest.filter((w) => !w.startsWith("-"));

    if (sub === "commit" && currentBranch(cwd) === "main") {
      block("don't commit on main. Create a branch first: git switch -c <short-name>.");
    }

    const creates =
      (sub === "checkout" && rest.some((w) => /^-[bB]$/.test(w))) ||
      (sub === "switch" && rest.some((w) => /^-[cC]$|^--create$/.test(w))) ||
      (sub === "branch" && args.length > 0) ||
      sub === "push";
    if (creates && args.some((w) => /(^|:|\/heads\/)claude\//.test(w))) {
      block("branch names can't start with claude/. Name the branch after the app or feature.");
    }

    if (sub === "push") {
      // args: [remote, ...refspecs]. A refspec "src:dst" pushes to dst.
      const refspecs = args.slice(1);
      const targets = refspecs.map((r) => r.split(":").pop());
      const toMain = targets.some((t) => MAIN.test(t));
      const implicit =
        refspecs.length === 0 || refspecs.every((r) => r === "HEAD" || r === "@");
      if (toMain || (implicit && currentBranch(cwd) === "main")) {
        block("never push to main; it deploys straight to jaeivan.com. Push a branch and open a PR.");
      }
    }
  }
}

function checkGitHub(tool, input) {
  checkAttribution(strings(input).join("\n"));

  const branch = input.branch ?? input.head ?? "";
  if (/^claude\//.test(branch)) {
    block("branch names can't start with claude/. Name the branch after the app or feature.");
  }
  // These tools commit straight to `branch`.
  if (/__(push_files|create_or_update_file|delete_file)$/.test(tool) && MAIN.test(branch)) {
    block("never commit to main; it deploys straight to jaeivan.com. Use a branch and open a PR.");
  }
}

let raw = "";
for await (const chunk of process.stdin) raw += chunk;
let event;
try {
  event = JSON.parse(raw);
} catch {
  process.exit(0);
}

const { tool_name: tool = "", tool_input: input = {}, cwd = process.cwd() } = event;
if (tool === "Bash") checkBash(input.command ?? "", cwd);
else if (tool.startsWith("mcp__github__")) checkGitHub(tool, input);
process.exit(0);
