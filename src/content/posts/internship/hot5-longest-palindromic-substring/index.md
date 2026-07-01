---
title: "Hot100-5. 最长回文子串"
description: "中心扩展法：从两段重复的 while 到用 lambda 复用逻辑"
section: internship
date: 2026-07-01
tags: [LeetCode, 双指针, Hot100, C++]
---

## 思路：中心扩展

回文串有对称中心，中心分两种：奇数长度（中心是一个字符）和偶数长度（中心是两个字符之间的空隙）。字符串长度为 `n`，一共有 `2n - 1` 个"中心位置"（n 个字符 + n-1 个空隙）。

遍历每个中心 `i`：
- `i` 是偶数（落在字符上）：`left = right = i/2`
- `i` 是奇数（落在空隙上）：`left = i/2`，`right = i/2 + 1`

从中心往两侧扩展，只要 `s[left] == s[right]` 就继续扩，同时更新最长回文的记录。

```cpp
class Solution {
public:
    string longestPalindrome(string s) {
        int n = s.size();
        int left = 0, right = 0, len = 0;
        int bestleft = 0, bestright = 0;
        for (int i = 0; i < 2 * n - 1; i++) {
            if (i % 2 == 0) {
                left = i / 2;
                right = i / 2;
            } else {
                left = i / 2;
                right = i / 2 + 1;
            }
            while (left >= 0 && right < n && s[left] == s[right]) {
                if (right - left + 1 > len) {
                    bestleft = left;
                    bestright = right;
                    len = max(len, right - left + 1);
                }
                right++;
                left--;
            }
        }
        return s.substr(bestleft, bestright - bestleft + 1);
    }
};
```

## 优化：用 lambda 消除重复的 while

上面的写法把奇偶两种中心揉进一次循环里，边界条件不够直观。更清晰的写法是按 `i` 正常遍历字符位置，对每个 `i` 分别尝试 `(i, i)` 和 `(i, i+1)` 两种中心，把扩展逻辑抽成一个 `expand` 函数复用：

```cpp
class Solution {
public:
    string longestPalindrome(string s) {
        int n = s.size();
        int bestleft = 0, bestright = 0, len = 0;
        auto expand = [&](int left, int right) {
            while (left >= 0 && right < n && s[left] == s[right]) {
                if (right - left + 1 > len) {
                    bestleft = left;
                    bestright = right;
                    len = max(len, right - left + 1);
                }
                left--;
                right++;
            }
        };
        for (int i = 0; i < n; i++) {
            expand(i, i);       // 奇数长度，中心是字符 i
            expand(i, i + 1);   // 偶数长度，中心是 i 和 i+1 之间的空隙
        }
        return s.substr(bestleft, bestright - bestleft + 1);
    }
};
```

主循环里只剩 `for` 加两行 `expand` 调用，不再有重复的 `while`。

### 顺带理解一下 `[&]` 引用捕获

`auto expand = [&](int left, int right) {...}` 里的 `[&]` 是 lambda 的捕获列表，表示"函数体里用到的外部变量全部按引用捕获"，等价于手写 `[&s, &bestleft, &bestright, &len]`。

对比一个和这题无关的最小例子：

```cpp
int counter = 0;
auto increase = [&counter](int step) {
    counter += step;
};
increase(3);  // 外面的 counter 变成了 3
```

`[&counter]` 是按引用捕获，lambda 内部对 `counter` 的修改，外面能看到；如果写成 `[counter]`（不加 `&`），是按值捕获，lambda 内部改的是自己的一份拷贝，外面不受影响。`[&]` 就是把这个"按引用"规则应用到所有被用到的外部变量，省得一个个列出来。这题里 `expand` 需要修改外层的 `bestleft`、`bestright`、`len`，所以必须用引用捕获，否则更新了也传不出去。
