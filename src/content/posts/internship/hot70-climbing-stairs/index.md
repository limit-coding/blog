---
title: "Hot100-70. 爬楼梯"
description: "DP 入门题：斐波那契式递推，注意边界条件"
section: internship
date: 2026-07-02
tags: [LeetCode, 动态规划, Hot100, C++]
---

## 思路

到第 `i` 级台阶的方法数，只能从第 `i-1` 级迈一步，或从第 `i-2` 级迈两步过来，所以 `dp[i] = dp[i-1] + dp[i-2]`，本质就是斐波那契数列。

```cpp
class Solution {
public:
    int climbStairs(int n) {
        vector<int> dp(n + 1);
        dp[0] = 1;
        dp[1] = 1;
        for (int i = 2; i <= n; i++) {
            dp[i] = dp[i - 1] + dp[i - 2];
        }
        return dp[n];
    }
};
```

唯一要注意的是边界：`dp[0] = 1` 表示"站在地面不动也算一种方案"，`dp[1] = 1` 是台阶数小于 2 时的特殊情况，两个都要初始化，否则 `dp[i-2]` 会越界或者值不对。DP 入门题，空间可以进一步优化成两个滚动变量，但数组写法更直观。
