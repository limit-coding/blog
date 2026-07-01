---
title: "Hot100-76. 最小覆盖子串"
description: "滑动窗口进阶题：right 扩张收集字符，valid 满足后收缩 left 找最优解"
section: internship
date: 2026-07-01
tags: [LeetCode, 滑动窗口, Hot100, C++]
---

## 思路

延续 [滑动窗口入门四题](/internship/sliding-window) 的模板，这题是变长窗口的进阶版：

1. `right` 一直往右走，把字符收进窗口
2. 当窗口内某个字符的数量凑够 `t` 里要求的数量时，`valid` 计数器加一
3. 当 `valid` 等于 `t` 里不同字符的种类数时，说明窗口已经覆盖了 `t`，开始尝试收缩 `left`，边收缩边记录最小窗口
4. 收缩到不再满足覆盖条件为止，`right` 继续前进，重复上述过程

用两个哈希表：`sub` 记录 `t` 里每个字符需要的数量，`mp` 记录当前窗口里每个字符已有的数量。

```cpp
class Solution {
public:
    string minWindow(string s, string t) {
        unordered_map<char, int> mp, sub;
        for (char ch : t) sub[ch]++;
        int left = 0, valid = 0;
        int bestLeft = -1, bestlen = INT_MAX;

        for (int right = 0; right < s.size(); right++) {
            char c = s[right];
            if (sub.count(c)) {
                mp[c]++;
                if (mp[c] == sub[c]) valid++;
            }

            while (valid == sub.size()) {
                if (right - left + 1 < bestlen) {
                    bestlen = right - left + 1;
                    bestLeft = left;
                }
                char d = s[left];
                if (sub.count(d)) {
                    if (mp[d] == sub[d]) valid--;
                    mp[d]--;
                }
                left++;
            }
        }
        return bestLeft == -1 ? "" : s.substr(bestLeft, bestlen);
    }
};
```

关键点是 `valid == sub.size()` 的判断——`valid` 统计的是"数量已经凑够的字符种类数"，而不是窗口里字符的总个数，这样才能正确处理 `t` 里有重复字符的情况（比如 `t = "AABC"`，`A` 需要收集 2 个才算这个字符"满足"）。收缩 `left` 时，只有当 `mp[d] == sub[d]`（即将要破坏满足状态）才把 `valid` 减一，顺序不能反：先判断再减 `mp[d]`。
