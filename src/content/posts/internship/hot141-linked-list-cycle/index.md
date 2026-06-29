---
title: Hot141 环形链表
description: 快慢指针判断链表是否有环，注意节点相等的判断用指针地址而非值
section: internship
date: 2026-06-29
tags: [LeetCode, 链表, 快慢指针]
---

## 思路

所有跟环有关的题都用快慢指针。fast 每次走两步，slow 每次走一步，如果链表有环，fast 最终一定会追上 slow。

## 代码

```cpp
class Solution {
public:
    bool hasCycle(ListNode *head) {
        ListNode* fast = head;
        ListNode* slow = head;
        while (fast != nullptr && fast->next != nullptr) {
            fast = fast->next->next;
            slow = slow->next;
            if (slow == fast) return true;
        }
        return false;
    }
};
```

## 要点

判断两个节点是否是同一个节点，必须用 `slow == fast`（比较指针地址），而不是 `fast->val == slow->val`——值相同不代表是同一个节点。
