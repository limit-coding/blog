---
title: "Hot100-15. 三数之和"
description: "排序 + 固定一个数 + 双指针收缩，把 O(n³) 降到 O(n²)，用 set 去重"
section: internship
date: 2026-07-01
tags: [LeetCode, 双指针, Hot100, C++]
---

## 思路

三元组问题，暴力是三层循环 O(n³)。先排序，固定第一个数 `nums[i]`，剩下两个数用双指针收缩：`j = i + 1`，`k = n - 1`，往中间靠拢。

- `nums[j] + nums[k] == -nums[i]`：找到一组解，`j++`、`k--` 继续找
- `nums[j] + nums[k] > -nums[i]`：和大了，`k--`（k 对应的数大，往小的方向收）
- `nums[j] + nums[k] < -nums[i]`：和小了，`j++`

结果不能重复，直接用 `set<vector<int>>` 存，省去手写去重逻辑，最后再转回 `vector<vector<int>>`。

```cpp
class Solution {
public:
    vector<vector<int>> threeSum(vector<int>& nums) {
        sort(nums.begin(), nums.end());
        int n = nums.size();
        set<vector<int>> q;
        for (int i = 0; i < n; i++) {
            int j = i + 1, k = n - 1;
            while (j != k && j < k && k <= n - 1) {
                int temp = nums[j] + nums[k];
                if (temp == -nums[i]) {
                    q.insert({nums[i], nums[j], nums[k]});
                    k--;
                    j++;
                } else if (temp > -nums[i]) {
                    k--;
                } else {
                    j++;
                }
            }
        }
        return vector<vector<int>>(q.begin(), q.end());
    }
};
```

排序是前提：没有单调性，双指针没法判断该收缩哪一侧。用 `set` 去重简单但有额外的排序开销，面试进阶写法是排序后跳过相邻重复元素（`if (i > 0 && nums[i] == nums[i-1]) continue;`），可以省掉 set 的开销。
