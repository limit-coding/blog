---
title: 前缀和配哈希表：计数与最长长度为何写法不同
description: 通过“和为 k 的子数组”理解前缀和、初始状态，以及频次表与最早下标表的区别。
section: internship
date: 2026-08-02
tags: [算法, 前缀和, 哈希表]
---

连续子数组求和题中，双层枚举的重复工作很多。前缀和把区间和改写成两个状态之差：

```text
sum(i..j) = prefix[j] - prefix[i-1]
```

当当前前缀和为 `prefix`，如果以前出现过 `prefix - k`，两者之间的子数组和就是 `k`。难点在于：题目要计数还是要最长长度，哈希表保存的内容不同。

## 统计子数组数量：保存出现次数

```cpp
int subarraySum(vector<int>& nums, int k) {
    unordered_map<long long, int> freq;
    freq[0] = 1;

    long long prefix = 0;
    int ans = 0;
    for (int x : nums) {
        prefix += x;
        if (freq.count(prefix - k)) {
            ans += freq[prefix - k];
        }
        ++freq[prefix];
    }
    return ans;
}
```

`freq[0] = 1` 代表在数组开始前已经有一个前缀和为零的状态，因此从下标 `0` 开始、和恰好为 `k` 的子数组也会被统计。

先查询再加入当前前缀，可以避免在 `k = 0` 时把空区间错误计入答案。

## 求最长长度：保存最早下标

若目标变成“和为 `k` 的最长子数组”，同一个前缀和只应保留最早出现位置：

```cpp
int maxSubArrayLen(vector<int>& nums, int k) {
    unordered_map<long long, int> first;
    first[0] = -1;

    long long prefix = 0;
    int ans = 0;
    for (int i = 0; i < static_cast<int>(nums.size()); ++i) {
        prefix += nums[i];
        if (first.count(prefix - k)) {
            ans = max(ans, i - first[prefix - k]);
        }
        if (!first.count(prefix)) first[prefix] = i;
    }
    return ans;
}
```

这里 `first[0] = -1` 同样表示数组开始前的状态。为了让区间尽可能长，前缀和重复出现时不能覆盖旧下标。

## 为什么滑动窗口不通用

数组含负数时，窗口和变大不代表右移左边界后一定变小，单调性消失。前缀和加哈希表不依赖元素正负，因此更通用。

我现在不再只背 `prefix - k`。我会先问：历史状态要回答“出现过几次”，还是“最早在哪里”？哈希表的语义一旦明确，初始化与更新顺序也会自然确定。
