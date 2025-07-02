---
layout: home

hero:
  name: "🌳 AgenTree"
  text: "Hierarchical AI Agents"
  tagline: TypeScript library for creating AI agents that recursively decompose tasks by spawning specialized children
  actions:
    - theme: brand
      text: Get Started
      link: /guide/installation
    - theme: alt
      text: View on GitHub
      link: https://github.com/Remenby31/agentree

features:
  - title: 🧠 Intelligent Task Decomposition
    details: Agents automatically analyze complex tasks and break them down into manageable subtasks, creating specialized child agents with specific roles and tools.
  - title: 🎯 Dynamic Agent Creation  
    details: Parent agents dynamically define the role, context, and available tools for their children based on the specific requirements of each subtask.
  - title: 📁 Automatic Documentation
    details: Complete execution traces are automatically saved as structured markdown reports, providing full transparency into the decision-making process.
  - title: 🔧 Flexible Tool System
    details: Transform any TypeScript function into an agent tool using Zod schema validation. Built-in tools included for common operations.
---