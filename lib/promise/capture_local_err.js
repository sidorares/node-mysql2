'use strict';

/** @param {Function} constructorOpt Passed to Error.captureStackTrace (omit this frame from stacks). */
function captureStackHolder(constructorOpt) {
  const holder = {};
  Error.captureStackTrace(holder, constructorOpt);
  return holder;
}

/**
 * Replace `err.stack` frames with the capture from `holder`, keeping the
 * callback error instance and its MySQL fields.
 *
 * @param {Error} err
 * @param {{ stack?: string }} holder
 */
function applyCapturedStack(err, holder) {
  const stack = holder && holder.stack;
  if (typeof stack !== 'string' || !stack) return;
  const lines = stack.split('\n');
  lines[0] = `${err.name}: ${err.message}`;
  err.stack = lines.join('\n');
}

module.exports = { captureStackHolder, applyCapturedStack };
