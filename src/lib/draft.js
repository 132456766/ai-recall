// 录入草稿自动保存（localStorage，同步、轻量）
// 仅持久化文本类字段；图片为 base64 体积过大，不纳入草稿以免超出配额。
const KEY = 'recall-entry-draft-v2';

export function saveDraft(draft) {
  try {
    const payload = { ...draft, savedAt: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(payload));
    return true;
  } catch (e) {
    return false; // 配额超限等：静默失败，不影响主流程
  }
}

export function loadDraft() {
  try {
    const s = localStorage.getItem(KEY);
    if (!s) return null;
    const d = JSON.parse(s);
    return d && typeof d === 'object' ? d : null;
  } catch (e) {
    return null;
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    /* noop */
  }
}
