---
title: Hot128 最长连续序列：HashSet O(n) 不排序
description: 要求 O(n)，不能 sort，用 HashSet 配合"只从序列起点开始数"的技巧，把双重循环的代价降掉
section: internship
date: 2026-06-29
tags: [LeetCode, 哈希表, C++]
---

## 题意

给一个未排序的整数数组，找出最长的连续元素序列的长度。要求时间复杂度 O(n)。

## 我的第一想法（错的）

先建哈希表，让 key 排序，然后遍历找连续段——问题是排序本身就是 O(n log n)，违反了题目约束。

## 正确思路：HashSet + 只从起点出发

用 `unordered_set` 存所有数字，遍历时只对"序列起点"展开计数。

**判断起点的方式**：如果 `num - 1` 不在 set 里，说明 `num` 是某段连续序列的第一个数。

然后从这个起点开始，不断检查 `cur + 1` 是否在 set 里，在就继续，不在就停止。

```cpp
class Solution {
public:
    int longestConsecutive(vector<int>& nums) {
        unordered_set<int> s(nums.begin(), nums.end());
        int ans = 0;
        for (int num : s) {
            if (!s.count(num - 1)) {
                int len = 1, cur = num;
                while (s.count(cur + 1)) len++, cur++;
                ans = max(len, ans);
            }
        }
        return ans;
    }
};
```

## 为什么是 O(n)

看起来有外层 for + 内层 while，像是 O(n²)。关键在于：每个数字最多被 while 循环访问一次（只有序列起点会触发 while，非起点直接跳过）。所有数字加起来总共被访问 2n 次，整体 O(n)。

## set vs map

| | `unordered_set` | `unordered_map` |
|---|---|---|
| 存什么 | 只存 key | key-value 对 |
| 用途 | 判断"在不在" | 查询 key 对应的值 |
| 128题 | ✅ 只需要查存不存在 | 多余 |

底层都是哈希表，区别只是 set 不需要附加 value，内存更省。
