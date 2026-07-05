// Avatar palette drawn from the design system's signal colors, plus a few
// muted extras so teammates are distinguishable without looking like confetti.
const COLORS = ['#2547FF', '#D6432F', '#3D7A5C', '#B75800', '#5B6472', '#8A4FBF', '#0E7C86', '#A34D8F'];

export function initials(name = '') {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function colorFor(id = '') {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function isOverdue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

export const PRIORITY_LABEL = { urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low' };

// Short manifest-style codes for the priority stamp (RUSH reads as triage shorthand)
export const PRIORITY_STAMP = { urgent: 'Rush', high: 'High', medium: 'Std', low: 'Low' };
