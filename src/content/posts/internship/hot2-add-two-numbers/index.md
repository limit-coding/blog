---
title: Hot2 两数相加
description: 链表逐位相加并维护进位，注意最后多出一位的边界情况
section: internship
date: 2026-06-29
tags: [LeetCode, 链表]
---

## 思路

两个链表逆序存储数字，直接对齐逐位相加。核心难点是**进位处理**：比如 999 + 1 = 1000，最后还要多生成一个节点。

所以 while 循环的退出条件是 `l1 == nullptr && l2 == nullptr && carry == 0`，只要还有进位就继续。

## 代码

```cpp
class Solution {
public:
    ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {
        ListNode* dummy = new ListNode(0);
        ListNode* cur = dummy;
        int carry = 0;

        while (l1 != nullptr || l2 != nullptr || carry) {
            int sum = 0;
            if (l1 != nullptr) sum += l1->val, l1 = l1->next;
            if (l2 != nullptr) sum += l2->val, l2 = l2->next;
            sum += carry;

            carry = sum / 10;
            int new_num = sum % 10;
            cur->next = new ListNode(new_num);
            cur = cur->next;
        }
        return dummy->next;
    }
};
```

## 要点

`carry = sum / 10`，`new_num = sum % 10`。进位只可能是 0 或 1（两个个位数加最多进 1），但写成通用形式更清晰。
