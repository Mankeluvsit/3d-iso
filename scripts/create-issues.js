const fs = require("fs");
const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const repo = process.env.REPO;
const [owner, repoName] = repo.split("/");

// Load JSON file
const data = JSON.parse(
  fs.readFileSync("issues/backlog.json", "utf8")
);

async function issueExists(title) {
  const { data: issues } = await octokit.rest.issues.listForRepo({
    owner,
    repo: repoName,
    state: "all",
    per_page: 100,
  });

  return issues.some((i) => i.title === title);
}

async function createIssue(issue) {
  const exists = await issueExists(issue.title);

  if (exists) {
    console.log(`SKIP (exists): ${issue.title}`);
    return;
  }

  await octokit.rest.issues.create({
    owner,
    repo: repoName,
    title: issue.title,
    body: issue.body || "",
    labels: issue.labels || [],
  });

  console.log(`CREATED: ${issue.title}`);
}

async function run() {
  for (const issue of data.issues) {
    try {
      await createIssue(issue);
    } catch (err) {
      console.error("ERROR:", issue.title, err.message);
    }
  }
}

run();
