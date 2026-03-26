#!/usr/bin/env node

const { LinearClient } = require("@linear/sdk");

const apiKey = process.env.LINEAR_API_KEY;
if (!apiKey) {
  console.error("Error: LINEAR_API_KEY environment variable is required");
  console.error("Get your API key from: https://linear.app/settings/api");
  process.exit(1);
}

const client = new LinearClient({ apiKey });

const commands = {
  async teams() {
    const teams = await client.teams();
    return teams.nodes.map((team) => ({
      id: team.id,
      name: team.name,
      key: team.key,
    }));
  },

  async projects(filter) {
    const projects = await client.projects(filter ? { filter } : {});
    return projects.nodes.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      state: project.state,
    }));
  },

  async createProject(name, description, teamIds) {
    const result = await client.createProject({
      name,
      description,
      teamIds: teamIds.split(","),
    });
    const project = await result.project;
    return { id: project.id, name: project.name };
  },

  async issues(filter) {
    const options = {};
    if (filter) {
      options.filter = JSON.parse(filter);
    }
    const issues = await client.issues(options);
    return issues.nodes.map((issue) => ({
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      state: issue.state?.name,
      assignee: issue.assignee?.name,
      priority: issue.priority,
    }));
  },

  async issue(identifier) {
    const issue = await client.issue(identifier);
    const comments = await issue.comments();
    return {
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      description: issue.description,
      state: issue.state?.name,
      assignee: issue.assignee?.name,
      priority: issue.priority,
      labels: issue.labels?.nodes?.map((label) => label.name) || [],
      comments: comments.nodes.map((comment) => ({
        id: comment.id,
        body: comment.body,
        user: comment.user?.name,
        createdAt: comment.createdAt,
      })),
    };
  },

  async createIssue(title, description, teamId, options = {}) {
    const parsedOptions = typeof options === "string" ? JSON.parse(options) : options;
    const result = await client.createIssue({
      title,
      description,
      teamId,
      ...parsedOptions,
    });
    const issue = await result.issue;
    return {
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
    };
  },

  async updateIssue(issueId, updates) {
    const updateData = typeof updates === "string" ? JSON.parse(updates) : updates;
    const result = await client.updateIssue(issueId, updateData);
    const success = await result.success;
    return { success };
  },

  async createComment(issueId, body) {
    const result = await client.createComment({
      issueId,
      body,
    });
    const comment = await result.comment;
    return { id: comment.id };
  },

  async states(teamId) {
    const team = await client.team(teamId);
    const states = await team.states();
    return states.nodes.map((state) => ({
      id: state.id,
      name: state.name,
      type: state.type,
    }));
  },

  async labels(teamId) {
    const team = await client.team(teamId);
    const labels = await team.labels();
    return labels.nodes.map((label) => ({
      id: label.id,
      name: label.name,
      color: label.color,
    }));
  },

  async user() {
    const user = await client.viewer;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  },
};

async function main() {
  const [, , command, ...args] = process.argv;

  if (!command || !commands[command]) {
    console.error("Usage: linear-cli.js <command> [args...]");
    console.error("\nAvailable commands:");
    console.error("  teams");
    console.error("  projects [filter]");
    console.error("  createProject <name> <description> <teamIds>");
    console.error("  issues [filter]");
    console.error("  issue <identifier>");
    console.error("  createIssue <title> <description> <teamId> [options]");
    console.error("  updateIssue <issueId> <updates>");
    console.error("  createComment <issueId> <body>");
    console.error("  states <teamId>");
    console.error("  labels <teamId>");
    console.error("  user");
    process.exit(1);
  }

  try {
    const result = await commands[command](...args);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = commands;
