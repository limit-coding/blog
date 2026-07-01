---
title: "Hot100-11. 盛最多水的容器"
description: "从 O(n²) 暴力枚举优化到双指针收缩，理解为什么每次移动较矮的那一侧"
section: internship
date: 2026-07-01
tags: [LeetCode, 双指针, Hot100, C++]
---

## 思路

暴力做法是遍历所有 `(i, j)` 组合算面积，O(n²)。想优化成双指针：`left = 0`，`right = n - 1`，从两端往中间收缩，每次比较 `height[left]` 和 `height[right]`，谁矮就移动谁，同时用 `capacity` 记录遍历过程中的最大值。

为什么移动矮的一侧是安全的：容器的容量由较矮的边决定，如果移动高的一侧，宽度变小，高度上限还是那根矮的，面积只会更小或不变；移动矮的一侧，虽然宽度也变小，但高度有可能变大，才有机会得到更优解。

```cpp
class Solution {
public:
    int maxArea(vector<int>& height) {
        int n = height.size();
        int capacity = 0;
        int left = 0;
        int right = n - 1;
        while (left != right) {
            if (height[left] < height[right]) {
                capacity = max(capacity, (right - left) * height[left]);
                left++;
            } else {
                capacity = max(capacity, (right - left) * height[right]);
                right--;
            }
        }
        return capacity;
    }
};
```

`left == right` 时结束，中途每一步都用较矮的高度乘以当前宽度更新 `capacity`。整体一次遍历，O(n)。
