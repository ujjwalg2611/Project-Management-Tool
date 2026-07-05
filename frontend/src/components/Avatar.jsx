import React from 'react';
import { initials, colorFor } from '../utils';

export default function Avatar({ user, size = 28, title }) {
  if (!user) return null;
  return (
    <div
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.4, background: colorFor(user._id || user.id || user.name) }}
      title={title || user.name}
    >
      {initials(user.name)}
    </div>
  );
}
