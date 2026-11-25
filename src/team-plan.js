(function () {
  const maxWorkers = 3;

  function parseTeamPlan(answer, workerCount) {
    const text = String(answer || '').trim();
    const fenced = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)].map((match) => match[1]);
    for (const candidate of [text, ...fenced.reverse()]) {
      let plan;
      try { plan = JSON.parse(candidate); } catch { continue; }
      if (!Array.isArray(plan?.tasks) || !plan.tasks.length || plan.tasks.length > Math.min(workerCount, maxWorkers)) continue;
      const used = new Set();
      const tasks = [];
      for (const item of plan.tasks) {
        if (!Number.isInteger(item?.worker) || item.worker < 1 || item.worker > workerCount || used.has(item.worker)) break;
        if (typeof item.title !== 'string' || typeof item.prompt !== 'string') break;
        const title = item.title.replace(/\s+/g, ' ').trim();
        const prompt = item.prompt.trim();
        if (!title || title.length > 90 || !prompt || prompt.length > 8000) break;
        used.add(item.worker);
        tasks.push({ worker: item.worker, title, prompt });
      }
      if (tasks.length === plan.tasks.length) return tasks;
    }
    return null;
  }

  const teamPlan = { maxWorkers, parseTeamPlan };
  if (typeof module === 'object' && module.exports) module.exports = teamPlan;
  else globalThis.fllamaTeamPlan = teamPlan;
})();
