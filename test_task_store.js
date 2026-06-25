const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  let p = ctx.pages().find(x => x.url().includes('aicut_marketing'));
  if (!p) { p = await ctx.newPage(); await p.goto('file:///C:/Users/paul/.openclaw/workspace/aicut_marketing_dashboard.html'); }
  await p.waitForTimeout(2000);
  
  // Navigate to tasks page
  await p.evaluate(() => {
    var btn = document.querySelector('.nav-item[data-page="tasks"]');
    if (btn) btn.click();
  });
  await p.waitForTimeout(500);
  
  // Check tasks functionality
  var r = await p.evaluate(() => {
    var tasks = taskStore.load();
    var timeline = document.getElementById('task-timeline');
    return {
      taskCount: tasks.length,
      firstTask: tasks[0] ? { id: tasks[0].id, status: tasks[0].status, time: tasks[0].time } : null,
      timelineHTML: timeline ? timeline.innerHTML.substring(0, 300) : 'no timeline'
    };
  });
  console.log(JSON.stringify(r, null, 2));
  
  // Try changing status
  await p.evaluate(() => {
    var tasks = taskStore.load();
    if (tasks.length > 0) {
      taskStore.setStatus(tasks[0].id, '진행중');
    }
  });
  
  // Verify
  var r2 = await p.evaluate(() => {
    var tasks = taskStore.load();
    return {
      firstTaskStatus: tasks[0] ? tasks[0].status : 'no tasks',
      allStatuses: tasks.map(t => t.status)
    };
  });
  console.log('\nAfter status change:', JSON.stringify(r2));
  
  console.log('DONE');
})();
