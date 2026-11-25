const { execFile } = require('node:child_process');
const { createHash, randomUUID } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { promisify } = require('node:util');
const { ollamaEnv } = require('./ollama-service');

const exec = promisify(execFile);

async function git(root, args, allowedCodes = [0]) {
  const env = ollamaEnv();
  env.GIT_OPTIONAL_LOCKS = '0';
  env.GIT_TERMINAL_PROMPT = '0';
  try {
    const { stdout } = await exec('git', ['-c', 'core.hooksPath=' + (process.platform === 'win32' ? 'NUL' : '/dev/null'), '-C', root, ...args], {
      env, encoding: 'utf8', maxBuffer: 2 * 1024 * 1024, timeout: 30000, windowsHide: true,
    });
    return stdout;
  } catch (error) {
    if (allowedCodes.includes(error.code)) return error.stdout;
    throw new Error(error.stderr?.trim() || (error.code === 'ENOENT' ? 'Git is not installed' : error.message));
  }
}

async function projectDirectory(root) {
  const directory = await fs.realpath(root);
  if (!(await fs.stat(directory)).isDirectory()) throw new Error('Project folder is unavailable');
  return directory;
}

async function inspectProject(root) {
  const directory = await projectDirectory(root);
  try {
    const repo = (await git(directory, ['rev-parse', '--show-toplevel'])).trim();
    const [branch, head] = await Promise.all([
      git(directory, ['symbolic-ref', '--quiet', '--short', 'HEAD'], [0, 1]),
      git(directory, ['rev-parse', '--verify', 'HEAD'], [0, 128]),
    ]);
    return { root: directory, repo: await fs.realpath(repo), branch: branch.trim(), head: head.trim(), git: true };
  } catch {
    return { root: directory, git: false };
  }
}

async function createWorktree(root, storage, baseCommit) {
  const project = await inspectProject(root);
  if (!project.git || path.relative(project.repo, project.root)) {
    throw new Error('Open the Git repository root to create a worktree.');
  }
  const base = baseCommit || project.head;
  if (!base) throw new Error('Create a Git commit before creating a worktree.');
  if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(base)) throw new Error('Invalid worktree base commit.');
  const id = randomUUID();
  const branch = 'fllama/' + id.slice(0, 12);
  const directory = path.join(storage, id);
  await fs.mkdir(storage, { recursive: true });
  await git(project.root, ['worktree', 'add', '-b', branch, directory, base]);
  return { directory, branch, base };
}

async function diffBase(root, base) {
  if (/^[a-f0-9]{40,64}$/.test(base || '')) return base;
  try {
    return (await git(root, ['rev-parse', '--verify', 'HEAD'])).trim();
  } catch {
    const format = (await git(root, ['rev-parse', '--show-object-format'])).trim();
    return createHash(format === 'sha256' ? 'sha256' : 'sha1').update('tree 0\0').digest('hex');
  }
}

async function listChanges(root, base) {
  const revision = await diffBase(root, base);
  const [tracked, untracked] = await Promise.all([
    git(root, ['diff', '--no-ext-diff', '--no-textconv', '--no-renames', '--name-status', '-z', '--relative', revision, '--']),
    git(root, ['ls-files', '--others', '--exclude-standard', '-z', '--', '.']),
  ]);
  const fields = tracked.split('\0').filter(Boolean);
  const changes = [];
  for (let i = 0; i < fields.length; i += 2) changes.push({ status: fields[i], path: fields[i + 1] });
  for (const file of untracked.split('\0').filter(Boolean)) changes.push({ status: '?', path: file });
  return changes;
}

async function readDiff(root, base, file, untracked) {
  if (typeof file !== 'string' || !file || path.isAbsolute(file) || file.split(/[/\\]/).includes('..')) {
    throw new Error('Invalid project path');
  }
  const output = untracked
    ? await git(root, ['diff', '--no-index', '--no-ext-diff', '--no-textconv', '--', process.platform === 'win32' ? 'NUL' : '/dev/null', file], [0, 1])
    : await git(root, ['--literal-pathspecs', 'diff', '--no-ext-diff', '--no-textconv', '--no-renames', '--relative', await diffBase(root, base), '--', file]);
  return output.length > 120000 ? output.slice(0, 120000) + '\n…' : output;
}

module.exports = { projectDirectory, inspectProject, createWorktree, listChanges, readDiff };
