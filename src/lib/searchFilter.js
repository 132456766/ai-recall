// 搜索结果二次筛选：在 AI 检索结果之上叠加维度过滤（前端纯函数，便于单测）
// filters: { subject?, mastery?, errorReason?, favorite?, difficulty?, kp? }
//   - subject: e.subject === subject
//   - mastery: e.masteryStatus === mastery
//   - errorReason: e.errorReason === errorReason
//   - favorite: e.favorite === true
//   - difficulty: e.difficulty >= difficulty（数值）
//   - kp: e.knowledgePoints 包含 kp
export function filterResults(results = [], filters = {}) {
  const { subject, mastery, errorReason, favorite, difficulty, kp } = filters;
  return results.filter((e) => {
    if (subject && e.subject !== subject) return false;
    if (mastery && e.masteryStatus !== mastery) return false;
    if (errorReason && e.errorReason !== errorReason) return false;
    if (favorite && !e.favorite) return false;
    if (typeof difficulty === 'number' && (e.difficulty || 0) < difficulty) return false;
    if (kp && !(e.knowledgePoints || []).includes(kp)) return false;
    return true;
  });
}
