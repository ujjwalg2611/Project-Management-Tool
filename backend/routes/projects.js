const express = require('express');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Workspace = require('../models/Workspace');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// Helper: confirm user belongs to the project's workspace
async function assertMember(req, res, project) {
  const workspace = await Workspace.findById(project.workspace);
  const role = workspace.roleOf(req.user._id);
  if (!role) {
    res.status(403).json({ error: 'Not a member of this workspace' });
    return null;
  }
  return role;
}

const TEMPLATES = {
  blank: () => [],
  sprint_board: () => [
    { name: 'Backlog', order: 0, color: '#94a3b8' },
    { name: 'To Do', order: 1, color: '#60a5fa' },
    { name: 'In Progress', order: 2, color: '#3b82f6' },
    { name: 'In Review', order: 3, color: '#f59e0b' },
    { name: 'Done', order: 4, color: '#22c55e' },
  ],
  bug_tracker: () => [
    { name: 'Reported', order: 0, color: '#f87171' },
    { name: 'Triaged', order: 1, color: '#fb923c' },
    { name: 'In Progress', order: 2, color: '#3b82f6' },
    { name: 'Fixed', order: 3, color: '#22c55e' },
    { name: 'Verified', order: 4, color: '#16a34a' },
  ],
  content_calendar: () => [
    { name: 'Ideas', order: 0, color: '#94a3b8' },
    { name: 'Drafting', order: 1, color: '#60a5fa' },
    { name: 'Editing', order: 2, color: '#f59e0b' },
    { name: 'Scheduled', order: 3, color: '#a78bfa' },
    { name: 'Published', order: 4, color: '#22c55e' },
  ],
};

// GET /api/projects?workspaceId=...
router.get('/', async (req, res, next) => {
  try {
    const { workspaceId, archived } = req.query;
    if (!workspaceId) return res.status(400).json({ error: 'workspaceId is required' });

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace || !workspace.roleOf(req.user._id)) {
      return res.status(403).json({ error: 'Not a member of this workspace' });
    }

    const projects = await Project.find({
      workspace: workspaceId,
      isArchived: archived === 'true',
    }).sort({ updatedAt: -1 });

    // Attach basic progress stats
    const withProgress = await Promise.all(
      projects.map(async (p) => {
        const total = await Task.countDocuments({ project: p._id });
        const done = await Task.countDocuments({ project: p._id, isCompleted: true });
        return {
          ...p.toObject(),
          isStarred: p.isStarredBy.some((id) => id.toString() === req.user._id.toString()),
          progress: total ? Math.round((done / total) * 100) : 0,
          taskCount: total,
        };
      })
    );

    res.json(withProgress);
  } catch (err) {
    next(err);
  }
});

// POST /api/projects
router.post('/', async (req, res, next) => {
  try {
    const { workspaceId, name, description, color, icon, template } = req.body;
    if (!workspaceId || !name) return res.status(400).json({ error: 'workspaceId and name are required' });

    const workspace = await Workspace.findById(workspaceId);
    const role = workspace?.roleOf(req.user._id);
    if (!role || role === 'viewer') return res.status(403).json({ error: 'Insufficient permissions' });

    const columns = (TEMPLATES[template] || Project.defaultColumns)();

    const project = await Project.create({
      workspace: workspaceId,
      name,
      description: description || '',
      color: color || '#6366f1',
      icon: icon || '📋',
      columns: columns.length ? columns : Project.defaultColumns(),
      createdBy: req.user._id,
    });

    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id
router.get('/:id', async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const role = await assertMember(req, res, project);
    if (!role) return;
    res.json(project);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/projects/:id - rename, description, color, icon
router.patch('/:id', async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const role = await assertMember(req, res, project);
    if (!role || role === 'viewer') return res.status(403).json({ error: 'Insufficient permissions' });

    const { name, description, color, icon } = req.body;
    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (color !== undefined) project.color = color;
    if (icon !== undefined) project.icon = icon;
    await project.save();
    res.json(project);
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:id/star - toggle star
router.post('/:id/star', async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const idx = project.isStarredBy.findIndex((id) => id.toString() === req.user._id.toString());
    if (idx >= 0) project.isStarredBy.splice(idx, 1);
    else project.isStarredBy.push(req.user._id);
    await project.save();
    res.json({ starred: idx < 0 });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:id/archive - toggle archive
router.post('/:id/archive', async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    project.isArchived = !project.isArchived;
    await project.save();
    res.json(project);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const role = await assertMember(req, res, project);
    if (!role || role !== 'admin') return res.status(403).json({ error: 'Only admins can delete projects' });

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// --- Columns ---

// POST /api/projects/:id/columns - add column
router.post('/:id/columns', async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const { name, color } = req.body;
    const order = project.columns.length ? Math.max(...project.columns.map((c) => c.order)) + 1 : 0;
    project.columns.push({ name, color: color || '#94a3b8', order });
    await project.save();
    res.status(201).json(project.columns[project.columns.length - 1]);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/projects/:id/columns/:columnId - rename/recolor/reorder/wipLimit
router.patch('/:id/columns/:columnId', async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const column = project.columns.id(req.params.columnId);
    if (!column) return res.status(404).json({ error: 'Column not found' });

    const { name, color, order, wipLimit } = req.body;
    if (name !== undefined) column.name = name;
    if (color !== undefined) column.color = color;
    if (order !== undefined) column.order = order;
    if (wipLimit !== undefined) column.wipLimit = wipLimit;

    await project.save();
    res.json(column);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:id/columns/:columnId
router.delete('/:id/columns/:columnId', async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const taskCount = await Task.countDocuments({ project: project._id, column: req.params.columnId });
    if (taskCount > 0) {
      return res.status(400).json({ error: 'Move or delete tasks in this column before deleting it' });
    }

    project.columns.id(req.params.columnId).deleteOne();
    await project.save();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// --- Tags ---

router.post('/:id/tags', async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    project.tags.push({ name: req.body.name, color: req.body.color || '#6366f1' });
    await project.save();
    res.status(201).json(project.tags[project.tags.length - 1]);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/tags/:tagId', async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    const tag = project.tags.id(req.params.tagId);
    if (!tag) return res.status(404).json({ error: 'Tag not found' });
    if (req.body.name !== undefined) tag.name = req.body.name;
    if (req.body.color !== undefined) tag.color = req.body.color;
    await project.save();
    res.json(tag);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id/tags/:tagId', async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    project.tags.id(req.params.tagId).deleteOne();
    await project.save();
    await Task.updateMany({ project: project._id }, { $pull: { tags: req.params.tagId } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
