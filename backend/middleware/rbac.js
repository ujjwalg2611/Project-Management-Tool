const Workspace = require('../models/Workspace');

/**
 * requireWorkspaceRole(['admin']) -> only admins
 * requireWorkspaceRole(['admin', 'member']) -> admins and members, not viewers
 *
 * Expects req.params.workspaceId OR req.body.workspaceId to identify the workspace.
 * Attaches req.workspace and req.workspaceRole for downstream handlers.
 */
function requireWorkspaceRole(allowedRoles) {
  return async function (req, res, next) {
    try {
      const workspaceId = req.params.workspaceId || req.body.workspaceId || req.query.workspaceId;
      if (!workspaceId) return res.status(400).json({ error: 'workspaceId is required' });

      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

      const role = workspace.roleOf(req.user._id);
      if (!role) return res.status(403).json({ error: 'Not a member of this workspace' });

      if (!allowedRoles.includes(role)) {
        return res.status(403).json({ error: `Requires one of roles: ${allowedRoles.join(', ')}` });
      }

      req.workspace = workspace;
      req.workspaceRole = role;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { requireWorkspaceRole };
