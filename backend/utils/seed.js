// Run with: npm run seed
// Creates a demo user, workspace, and project with a few tasks so you can
// log in and see something immediately.
require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Project = require('../models/Project');
const Task = require('../models/Task');

async function seed() {
  await connectDB();

  await Promise.all([User.deleteMany({}), Workspace.deleteMany({}), Project.deleteMany({}), Task.deleteMany({})]);

  const passwordHash = await User.hashPassword('password123');
  const demo = await User.create({ name: 'Demo User', email: 'demo@example.com', passwordHash });
  const teammate = await User.create({ name: 'Alex Chen', email: 'alex@example.com', passwordHash });

  const workspace = await Workspace.create({
    name: 'Demo Workspace',
    owner: demo._id,
    members: [
      { user: demo._id, role: 'admin' },
      { user: teammate._id, role: 'member' },
    ],
  });

  const project = await Project.create({
    workspace: workspace._id,
    name: 'Website Redesign',
    description: 'Q3 marketing site refresh',
    color: '#6366f1',
    icon: '🚀',
    columns: Project.defaultColumns(),
    tags: [
      { name: 'Design', color: '#a78bfa' },
      { name: 'Backend', color: '#60a5fa' },
    ],
    createdBy: demo._id,
  });

  const [todo, inProgress] = project.columns;

  await Task.create([
    {
      project: project._id,
      column: todo._id,
      title: 'Design new homepage hero',
      priority: 'high',
      order: 0,
      assignees: [teammate._id],
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      createdBy: demo._id,
    },
    {
      project: project._id,
      column: inProgress._id,
      title: 'Set up staging environment',
      priority: 'medium',
      order: 0,
      assignees: [demo._id],
      createdBy: demo._id,
    },
  ]);

  console.log('Seed complete. Login with demo@example.com / password123');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
