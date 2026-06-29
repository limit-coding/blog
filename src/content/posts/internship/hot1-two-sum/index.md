---
title: Hot1 两数之和：从 O(n²) 到哈希表 O(n)
description: 暴力双重循环解完以后，理解为什么哈希表能把时间复杂度降一个量级，以及插入顺序为什么很关键
section: internship
date: 2026-06-29
tags: [LeetCode, 哈希表, C++]
---

## 题意

给一个数组和一个 target，找出两个数之和等于 target 的下标。

## 暴力解：O(n²)

```cpp
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        for (int i = 0; i < nums.size(); i++) {
            for (int j = i + 1; j < nums.size(); j++) {
                if (target == nums[i] + nums[j]) return {i, j};
            }
        }
        return {};
    }
};
```

两层循环，能过但慢。C++ 里返回数组字面量要用大括号 `{i, j}`。

## 哈希表解：O(n)

核心思路：把双重循环拆成"存"和"查"两步。

用 `unordered_map<int, int>`，key 存数组值，value 存下标。遍历时，检查 `target - nums[i]` 在不在表里——在的话说明找到了，直接返回。

```cpp
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> map;
        for (int i = 0; i < nums.size(); i++) {
            if (map.count(target - nums[i])) return {map[target - nums[i]], i};
            map[nums[i]] = i;
        }
        return {};
    }
};
```

**注意插入顺序**：先查，再插入。如果先 `map[nums[i]] = i` 再查，遇到 `target = 6`、第一个数是 `3` 时，会查到自己（`6-3=3`，下标 0），返回 `{0, 0}`，结果错误。

先查再插可以保证：查的时候表里没有当前元素自己，不会跟自己配对。

## 哈希表的关键

key 存数值、value 存下标，而不能反过来。哈希表只支持"给 key 查 value"，不支持"给 value 查 key"。这道题需要的是"已知数值，查它在哪个位置"，所以 key=数值、value=下标。
