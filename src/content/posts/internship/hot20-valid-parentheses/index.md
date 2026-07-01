---
title: "Hot100-20. 有效的括号"
description: "用栈匹配括号对，注意两种边界情况：空栈时遇到右括号、遍历结束后栈非空"
section: internship
date: 2026-06-30
tags: [LeetCode, 栈, Hot100, C++]
---

## 思路

用栈来做。遇到左括号就压栈，遇到右括号就检查栈顶是否匹配。

有两种边界情况要处理：
1. `)` 类型——栈已空时收到右括号，直接返回 false
2. `(])` 类型——括号顺序错误，栈顶不匹配

```cpp
class Solution {
public:
    bool isValid(string s) {
        stack<char> st;
        for (int i = 0; i < s.size(); i++) {
            if (s[i] == '(' || s[i] == '{' || s[i] == '[') {
                st.push(s[i]);
            }
            if (s[i] == ')' || s[i] == '}' || s[i] == ']') {
                if (st.empty()) return false;
                char top = st.top();
                if (s[i] == ')') {
                    if (top == '(') st.pop();
                    else return false;
                }
                if (s[i] == '}') {
                    if (top == '{') st.pop();
                    else return false;
                }
                if (s[i] == ']') {
                    if (top == '[') st.pop();
                    else return false;
                }
            }
        }
        if (!st.empty()) return false;
        return true;
    }
};
```

## 总结

比较直接，难点在于两个边界：收到右括号时栈已空、以及括号不对称（`(]` 这种情况）。遍历结束后栈非空也要返回 false——说明还有未匹配的左括号。
